export type HostBindingId = string;

export type PhysicsHandles = {
  rb: number;
  co: number;
};

export type HostBindingRecord = {
  id: HostBindingId;
  birthLineage: string;
  ordinal: number;
  status: 'live' | 'retired';
  handles: PhysicsHandles;
  createdTick: number;
  retiredTick: number | null;
};

export type HostBindingRegistrySnapshot = {
  birthLineage: string;
  nextOrdinal: number;
  records: HostBindingRecord[];
};

function cloneRecord(record: HostBindingRecord): HostBindingRecord {
  return {
    ...record,
    handles: { ...record.handles },
  };
}

/**
 * Research/runtime provenance identity for material host bindings.
 *
 * This is deliberately NOT actor-private identity. It exists so Chronicle/Fork
 * tooling can refer to a material binding across exact restore/fork without
 * treating a Rapier raw handle as durable object identity.
 */
export class HostBindingRegistry {
  private records = new Map<HostBindingId, HostBindingRecord>();
  private nextOrdinal: number;

  constructor(
    readonly birthLineage: string,
    nextOrdinal = 0,
    records: HostBindingRecord[] = [],
  ) {
    this.nextOrdinal = nextOrdinal;
    for (const record of records) {
      if (this.records.has(record.id)) {
        throw new Error(`duplicate HostBindingId ${record.id}`);
      }
      this.records.set(record.id, cloneRecord(record));
    }
  }

  allocate(handles: PhysicsHandles, tick: number): HostBindingId {
    const ordinal = this.nextOrdinal++;
    const id = `hb:${this.birthLineage}:${ordinal}`;
    if (this.records.has(id)) {
      throw new Error(`HostBindingId reuse attempted: ${id}`);
    }
    this.records.set(id, {
      id,
      birthLineage: this.birthLineage,
      ordinal,
      status: 'live',
      handles: { ...handles },
      createdTick: tick,
      retiredTick: null,
    });
    return id;
  }

  retire(id: HostBindingId, tick: number): void {
    const record = this.requireRecord(id);
    if (record.status === 'retired') {
      throw new Error(`HostBindingId already retired: ${id}`);
    }
    record.status = 'retired';
    record.retiredTick = tick;
  }

  get(id: HostBindingId): HostBindingRecord | null {
    const record = this.records.get(id);
    return record ? cloneRecord(record) : null;
  }

  isLive(id: HostBindingId): boolean {
    return this.records.get(id)?.status === 'live';
  }

  resolve(world: any, id: HostBindingId): { rb: any; co: any } | null {
    const record = this.records.get(id);
    if (!record || record.status !== 'live') return null;

    const rb = world.getRigidBody(record.handles.rb);
    const co = world.getCollider(record.handles.co);
    if (!rb || !co) {
      throw new Error(`live HostBindingId lost physics binding: ${id}`);
    }

    // Rapier JS may resolve a stale raw handle to a newly live object after
    // allocator churn. A live host binding must therefore verify that the
    // resolved object's *reported current handle* is exactly the recorded one.
    if (rb.handle !== record.handles.rb || co.handle !== record.handles.co) {
      throw new Error(
        `physics handle alias detected for ${id}: expected rb=${record.handles.rb} co=${record.handles.co}, got rb=${rb.handle} co=${co.handle}`,
      );
    }
    return { rb, co };
  }

  fork(childBirthLineage: string): HostBindingRegistry {
    if (!childBirthLineage || childBirthLineage === this.birthLineage) {
      throw new Error('fork requires a distinct non-empty birth lineage');
    }
    // Inherited records keep their original IDs. Only new births use the
    // child lineage, whose ordinal begins independently at zero.
    return new HostBindingRegistry(
      childBirthLineage,
      0,
      [...this.records.values()].map(cloneRecord),
    );
  }

  snapshot(): HostBindingRegistrySnapshot {
    return {
      birthLineage: this.birthLineage,
      nextOrdinal: this.nextOrdinal,
      records: [...this.records.values()]
        .map(cloneRecord)
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
  }

  static restore(snapshot: HostBindingRegistrySnapshot): HostBindingRegistry {
    return new HostBindingRegistry(
      snapshot.birthLineage,
      snapshot.nextOrdinal,
      snapshot.records,
    );
  }

  ids(): HostBindingId[] {
    return [...this.records.keys()].sort();
  }

  private requireRecord(id: HostBindingId): HostBindingRecord {
    const record = this.records.get(id);
    if (!record) throw new Error(`unknown HostBindingId: ${id}`);
    return record;
  }
}
