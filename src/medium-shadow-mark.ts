import {
  R3AE01Host,
  type R3AMoment,
} from './medium-e01-interaction-host';

export class R3BShadowMarkSession {
  private live: R3AE01Host | null;
  private referenceA: R3AE01Host | null = null;
  private workingB: R3AE01Host | null = null;
  private markMoment: R3AMoment | null = null;
  private markTickValue: number | null = null;
  private forkExposed = false;

  private constructor(live: R3AE01Host) {
    this.live = live;
  }

  static create(): R3BShadowMarkSession {
    return new R3BShadowMarkSession(R3AE01Host.create());
  }

  step(): void {
    if (this.markMoment === null) {
      if (!this.live) throw new Error('R3B live host missing before MARK');
      this.live.step();
      return;
    }
    if (!this.referenceA || !this.workingB) {
      throw new Error('R3B latent branches missing after MARK');
    }
    this.referenceA.step();
    this.workingB.step();
  }

  mark(momentId: string): {
    tick: number;
    immediateEqual: boolean;
  } {
    if (this.markMoment !== null) {
      throw new Error('R3B supports one active MARK in this probe');
    }
    if (!this.live) throw new Error('R3B live host missing');

    const before = JSON.stringify(this.live.stableState());
    const moment = this.live.capture(momentId);

    const a = R3AE01Host.restore(
      moment,
      'r3b/A',
      'moment:r3b:A',
      'root/A',
    );
    const b = R3AE01Host.restore(
      moment,
      'r3b/B',
      'moment:r3b:B',
      'root/B',
    );

    const equal =
      JSON.stringify(a.stableState()) === before &&
      JSON.stringify(b.stableState()) === before &&
      JSON.stringify(a.stableState()) === JSON.stringify(b.stableState());

    if (!equal) {
      a.destroy();
      b.destroy();
      throw new Error('R3B MARK exact replacement failed');
    }

    this.live.destroy();
    this.live = null;
    this.referenceA = a;
    this.workingB = b;
    this.markMoment = moment;
    this.markTickValue = moment.provenance.causalTick;

    return {
      tick: this.markTickValue,
      immediateEqual: true,
    };
  }

  exposeFork(): {
    markTick: number;
    currentTick: number;
    ageTicks: number;
  } {
    if (
      this.markMoment === null ||
      this.markTickValue === null ||
      !this.referenceA ||
      !this.workingB
    ) {
      throw new Error('R3B FORK exposure requires MARK');
    }

    if (
      JSON.stringify(this.referenceA.stableState()) !==
      JSON.stringify(this.workingB.stableState())
    ) {
      throw new Error('R3B latent A/B drifted before FORK exposure');
    }

    this.forkExposed = true;
    return {
      markTick: this.markTickValue,
      currentTick: this.workingB.tick,
      ageTicks: this.workingB.tick - this.markTickValue,
    };
  }

  applyWorkingImpulse(x: number, y: number, eventId: string): void {
    if (!this.forkExposed) {
      throw new Error('R3B intervention requires semantic FORK exposure');
    }
    if (!this.workingB) throw new Error('R3B working branch missing');
    this.workingB.applyLooseImpulse(x, y, eventId);
  }

  getVisible(): R3AE01Host {
    if (this.markMoment === null) {
      if (!this.live) throw new Error('R3B live host missing');
      return this.live;
    }
    if (!this.workingB) throw new Error('R3B working branch missing');
    return this.workingB;
  }

  getReference(): R3AE01Host | null {
    return this.referenceA;
  }

  get markTick(): number | null {
    return this.markTickValue;
  }

  get exposed(): boolean {
    return this.forkExposed;
  }

  destroy(): void {
    this.live?.destroy();
    this.referenceA?.destroy();
    this.workingB?.destroy();
    this.live = null;
    this.referenceA = null;
    this.workingB = null;
  }
}
