#!/usr/bin/env python3
"""PP3: stream ORIGINAL Fortran 42-line cell records, never load 360MB snapshot.

Host-only topology/continuity diagnostic; no manipulation of cell state.
Source: A5size/OpenPraparat@e9e105d48ab597612d1749a5f169663559b12287
      src/praparat.f90 write_cell_into_one, lines 2108-2207.
"""
from __future__ import annotations
import collections, hashlib, json, pathlib, tarfile, math, statistics

WORK=pathlib.Path("/tmp/pp2-preserved-dumbbell-normal")
AUDIT=pathlib.Path("artifacts/praparat/pp2_original_normal_lifecycle_audit.json")
DEST=pathlib.Path("artifacts/praparat/pp3_native_cell_lineage.json")
STEPS=(80,160,240)
FIELDS=42
MAX_RECORDS=15000
report={"status":"UNVERIFIED","source_format":"original write_cell_into_one: 42 lines per slot",
        "source_sha":"e9e105d48ab597612d1749a5f169663559b12287",
        "protocol":"docs/research/RB_PP3_ORIGINAL_CELL_COHORT_ARMED_2026-10-23.md",
        "host_only_labels":True,"source_engine_edited":False,"snapshots":[]}
DEST.parent.mkdir(parents=True,exist_ok=True)

def first_int(b):
    return int(b.strip().split()[0])
def values_int(b,n):
    v=[int(x) for x in b.strip().split()]
    if len(v)!=n:raise ValueError(f"record integer-vector expects {n}, saw {len(v)}")
    return v
def float_first(b):
    return float(b.strip().split()[0].replace(b"D",b"E"))
def parse_slot(fp,i):
    # Read every author-specified serialized line exactly once, no skipping records.
    # Book potentially 65536B; hash it only for existing cells, not whole snapshot.
    state={}
    existline=fp.readline()
    if not existline:raise ValueError(f"truncated cell slot {i}")
    exist=first_int(existline)
    book=fp.readline()
    marker=fp.readline()
    advance=fp.readline()
    if not book.startswith(b"!") or not marker.startswith(b"!") or not advance.startswith(b"!"):
        raise ValueError(f"invalid original book encoding at cell {i}")
    if exist:
        state["exist"]=exist
        state["book_sha"]=hashlib.sha256(book.rstrip(b"\r\n")).hexdigest()[:18]
    # Exact zero-based serialization fields verified against original author source.
    needed={4:"position",6:"velocity",10:"light_r",11:"light_g",12:"light_b",
            15:"energy",17:"internal_id",18:"age",19:"sensor_vector",
            20:"effector_vector",21:"neural_w1",22:"neural_w2",
            26:"ccf",27:"iocc",30:"hit_cell_flag",33:"eat_flag",
            35:"light_flag",36:"info",37:"neural_flag"}
    for field in range(4,FIELDS):
        line=fp.readline()
        if not line:raise ValueError(f"truncated cell {i}, field {field}")
        if not exist or field not in needed:continue
        kind=needed[field]
        if kind in ("ccf","iocc"):state[kind]=values_int(line,8)
        elif kind in ("position","velocity"):
            values=[float(v.replace(b"D",b"E")) for v in line.split()]
            if len(values)!=3 or not all(math.isfinite(v) for v in values):
                raise ValueError("original xyz/velocity field malformed")
            state[kind]=tuple(values)
        elif kind in ("sensor_vector","effector_vector"):
            # Original author NN stored values; do not infer live contact solely from vector.
            values=[float(v.replace(b"D",b"E")) for v in line.split()]
            if not values or not all(math.isfinite(v) for v in values):
                raise ValueError("original neural IO not finite")
            state[kind+"_mean_abs"]=sum(abs(x) for x in values)/len(values)
            state[kind+"_nonzero_fraction"]=sum(abs(x)>1e-8 for x in values)/len(values)
        elif kind in ("neural_w1","neural_w2"):
            state[kind+"_sha"]=hashlib.sha256(line.strip()).hexdigest()[:18]
        elif kind in ("energy","light_r","light_g","light_b"):
            v=float_first(line)
            if not math.isfinite(v):raise ValueError("original scalar not finite: "+kind)
            state[kind]=v
        else:state[kind]=first_int(line)
    return state if exist else None

def build_components(cells):
    active=set(cells)
    adjacency={i:set() for i in active}
    invalid=[]
    nonreciprocal=0
    edges=set()
    raw_flags=0
    for i,cell in cells.items():
        for flag,j in zip(cell["ccf"],cell["iocc"]):
            if flag!=1:continue
            raw_flags+=1
            if j not in active or j==i:
                invalid.append((i,j))
                continue
            adjacency[i].add(j)
            adjacency[j].add(i)
            edges.add(tuple(sorted((i,j))))
            other=cells[j]
            if not any(oflag==1 and target==i for oflag,target in zip(other["ccf"],other["iocc"])):
                nonreciprocal+=1
    seen=set()
    groups=[]
    parent={}
    for i in sorted(active):
        if i in seen:continue
        todo=[i]
        seen.add(i)
        group=[]
        while todo:
            v=todo.pop()
            group.append(v)
            for adj in adjacency[v]:
                if adj not in seen:
                    seen.add(adj)
                    todo.append(adj)
        group.sort()
        idx=len(groups)
        for v in group:parent[v]=idx
        groups.append(group)
    groups.sort(key=len,reverse=True)
    # Reindex ordered groups so lineage references are internally consistent.
    parent={slot:k for k,g in enumerate(groups) for slot in g}
    summary={
        "source_active_slots":len(active),
        "source_non_information_cells":sum(c["info"]==0 for c in cells.values()),
        "source_information_cells":sum(c["info"]==1 for c in cells.values()),
        "source_total_energy_including_sun":sum(c["energy"] for c in cells.values()),
        "source_total_energy_excluding_sun_slot1":sum(c["energy"] for i,c in cells.items() if i!=1),
        "source_internal_id_equal_slot":sum(c["internal_id"]==i for i,c in cells.items()),
        "source_internal_id_other_slot":sum(c["internal_id"]!=i for i,c in cells.items()),
        "active_flag_directed_count":raw_flags,
        "unique_undirected_edges":len(edges),
        "invalid_link_target_count":len(invalid),
        "nonreciprocal_directed_link_count":nonreciprocal,
        "components_all_active_cells":len(groups),
        "components_with_2_or_more":sum(len(g)>=2 for g in groups),
        "components_with_6_or_more":sum(len(g)>=6 for g in groups),
        "singletons":sum(len(g)==1 for g in groups),
        "largest_components_cell_counts":[len(g) for g in groups[:20]],
        "largest_components_non_information_counts":[sum(cells[i]["info"]==0 for i in g) for g in groups[:10]],
        "largest_components_energy":[round(sum(cells[i]["energy"] for i in g),5) for g in groups[:10]],
    }
    return summary,groups,parent

def parse_native_file(t):
    raw=WORK/f"cells{t//80}.dat.tar.gz"
    assert raw.is_file(),f"original source output absent {raw.name}"
    with tarfile.open(raw,"r:gz") as tar:
        expected=f"cells{t//80}.dat"
        fs=[m for m in tar.getmembers() if m.isfile() and m.name in (expected,"./"+expected)]
        if len(fs)!=1:raise ValueError(f"no unique native internal state {raw.name}")
        assert fs[0].size>10
        with tar.extractfile(fs[0]) as fd:
            number=first_int(fd.readline())
            if number!=MAX_RECORDS:raise ValueError("unexpected original slot count")
            cells={}
            for i in range(1,number+1):
                state=parse_slot(fd,i)
                if state is not None:cells[i]=state
            trailer=fd.read(1)
            if trailer.strip():raise ValueError("unexpected trailing source data")
    summary,groups,parents=build_components(cells)
    return {"t":t,"cells":cells,"groups":groups,"parents":parents,"summary":summary}

def cohort_continuity(src,dst):
    dt=dst["t"]-src["t"]
    cells0,cells1=src["cells"],dst["cells"]
    same_slots=set(cells0)&set(cells1)
    ageing={i for i in same_slots if cells1[i]["age"]-cells0[i]["age"]==dt}
    unchanged_books=sum(cells0[i]["book_sha"]==cells1[i]["book_sha"] for i in ageing)
    delta_dist=collections.Counter(cells1[i]["age"]-cells0[i]["age"] for i in same_slots)
    predecessors=[]
    for g in src["groups"]:
        if len(g)<6:continue
        surviving=[i for i in g if i in ageing]
        target_counts=collections.Counter(dst["parents"][i] for i in surviving)
        predecessors.append({"original_cells":len(g),
           "same_aged_survivors":len(surviving),
           "retention_of_original":round(len(surviving)/len(g),6),
           "target_components":len(target_counts),
           "largest_target_cohort":max(target_counts.values(),default=0),
           "target_sizes_for_largest":[len(dst["groups"][k]) for k,n in target_counts.most_common(3)],
           "survivor_distribution":sorted(target_counts.values(),reverse=True)[:6]})
    predecessors.sort(key=lambda x:x["original_cells"],reverse=True)
    return {
      "from":src["t"],"to":dst["t"],"original_active":len(cells0),
      "later_active":len(cells1),
      "same_numeric_slots":len(same_slots),
      "slots_with_exact_age_progression":len(ageing),
      "fraction_prior_active_with_age_consistent_survival":round(len(ageing)/len(cells0),6),
      "fraction_same_slots_with_age_consistent_survival":round(len(ageing)/max(1,len(same_slots)),6),
      "age_consistent_with_identical_original_book_hash":unchanged_books,
      "leading_same_slot_age_deltas":delta_dist.most_common(10),
      "large_predecessor_cohorts":len(predecessors),
      "largest_predecessor_component_lineages":predecessors[:15],
      "large_predecessors_with_survivors_in_multiple_later_components":
        sum(x["target_components"]>1 for x in predecessors),
      "large_predecessors_with_any_age_continuity":
        sum(x["same_aged_survivors"]>0 for x in predecessors),
    }

def observed_native_edges(cells):
    """Source CCF/IOCC reciprocal physical spring edges; no synthetic IDs."""
    edges=set()
    for slot,cell in cells.items():
        for flag,target in zip(cell["ccf"],cell["iocc"]):
            if flag==1 and target in cells and target!=slot:
                edges.add(tuple(sorted((slot,target))))
    return edges

def complete_fragment_cohort(src,dst):
    """Every source multicell unit, no outcome filtering, no organism labels."""
    dt=dst["t"]-src["t"]
    old,new=src["cells"],dst["cells"]
    survivors={i for i in (old.keys()&new.keys())
               if new[i]["age"]-old[i]["age"]==dt}
    bands=collections.Counter(
      "6+" if len(g)>=6 else str(len(g)) for g in src["groups"])
    categories=collections.Counter()
    by_size={}
    source_units=[g for g in src["groups"] if len(g)>=2]
    for group in source_units:
        src_n=len(group)
        category="6+" if src_n>=6 else str(src_n)
        sub=by_size.setdefault(category,collections.Counter())
        sub["source_fragments"]+=1
        sub["source_constituent_cells"]+=src_n
        surviving=[v for v in group if v in survivors]
        destination=collections.Counter(dst["parents"][v] for v in surviving)
        remaining=len(surviving)
        maxco=max(destination.values(),default=0)
        # Full original membership AND no extra members in successor: very strict
        exact=(remaining==src_n and len(destination)==1 and
               set(dst["groups"][next(iter(destination))])==set(group))
        labels={
          "all_members_age_continuous":remaining==src_n,
          "all_members_remain_together":remaining==src_n and len(destination)==1,
          "exact_member_set_unmodified":bool(exact),
          "coherent_core_at_least_two":maxco>=2,
          "partial_group_cell_loss":0<remaining<src_n,
          "all_original_cells_absent":remaining==0,
          "survivors_distributed_across_components":len(destination)>1,
          "all_surviving_cells_isolated":remaining>=2 and maxco==1,
          "at_least_one_constituent_survives":remaining>0
        }
        for label,truth in labels.items():
            if truth:
                categories[label]+=1
                sub[label]+=1
        categories["original_multicell_fragments"]+=1
        categories["original_multicell_cells"]+=src_n
        categories["retained_age_continuous_multicell_cells"]+=remaining
        sub["retained_age_continuous_cells"]+=remaining
    edges0=observed_native_edges(old)
    edges1=observed_native_edges(new)
    pre_both={(a,b) for a,b in edges0 if a in survivors and b in survivors}
    preserved=pre_both & edges1
    # Count destination components that contain ancestors from distinct
    # originally connected, multicell fragments. This is a diagnostic for
    # physical recombination, not romantic organism lineage.
    destination_sources=collections.defaultdict(set)
    source_sizes={i:len(g) for i,g in enumerate(src["groups"])}
    for v in survivors:
        original=src["parents"][v]
        if source_sizes[original]>=2:
            destination_sources[dst["parents"][v]].add(original)
    return {
       "from":src["t"],"to":dst["t"],
       "original_component_size_counts":dict(sorted(bands.items())),
       "all_multicell_source_unit_summary":dict(categories),
       "multicell_by_original_size":{k:dict(v) for k,v in sorted(by_size.items())},
       "native_original_edges":len(edges0),
       "native_later_edges":len(edges1),
       "native_edges_whose_endpoints_age_consistent":len(pre_both),
       "native_spring_edges_preserved":len(preserved),
       "spring_retention_given_both_aged":round(len(preserved)/len(pre_both),6) if pre_both else None,
       "later_components_with_descendants_from_multiple_multicell_origins":
          sum(len(u)>1 for u in destination_sources.values()),
       "later_multicell_components_with_any_same_aged_original_multicell_cell":
          sum(len(dst["groups"][k])>=2 for k in destination_sources)
    }


def pp4_percentiles(v):
    if not v:return {"n":0,"median":None,"p25":None,"p75":None}
    a=sorted(float(x) for x in v)
    def at(q):
        i=(len(a)-1)*q
        lo=int(i);hi=min(len(a)-1,lo+1)
        return round(a[lo]+(a[hi]-a[lo])*(i-lo),6)
    return {"n":len(a),"median":at(.5),"p25":at(.25),"p75":at(.75)}

def pp4_quantile_cut(v,q):
    a=sorted(v)
    i=(len(a)-1)*q
    lo=int(i);hi=min(len(a)-1,lo+1)
    return a[lo]+(a[hi]-a[lo])*(i-lo)

def pp4_dist(x,y):
    return math.sqrt(sum((a-b)**2 for a,b in zip(x,y)))

def pp4_avg3(v):
    return tuple(sum(x[i] for x in v)/len(v) for i in range(3))

def pp4_functional_cohort(src,dst):
    """Descriptive same-physical-members outcomes; NOT a learned-behavior classifier."""
    old,new=src["cells"],dst["cells"]
    dt=dst["t"]-src["t"]
    age={i for i in old.keys()&new.keys() if new[i]["age"]-old[i]["age"]==dt}
    ages_nonsolar=[i for i in age if i!=1]
    drift=pp4_avg3([tuple(new[i]["position"][d]-old[i]["position"][d] for d in range(3))
                    for i in ages_nonsolar])
    records=[]
    initial_groups=[group for group in src["groups"] if 2<=len(group)<=5]
    centers=[pp4_avg3([old[i]["position"] for i in group]) for group in initial_groups]
    cuts_x=[pp4_quantile_cut([v[0] for v in centers], q) for q in (.25,.5,.75)]
    cuts_z=[pp4_quantile_cut([v[2] for v in centers], q) for q in (.25,.5,.75)]
    def quartile(x,cuts):
        return sum(x>boundary for boundary in cuts)
    for group,start_center in zip(initial_groups,centers):
        if not all(i in age for i in group):continue
        following={new[i]["internal_id"] for i in group}
        if len(following)!=len(group):continue
        if len({dst["parents"][i] for i in group})!=1:continue
        k=dst["parents"][group[0]]
        if set(dst["groups"][k])!=set(group):continue
        c1=pp4_avg3([new[i]["position"] for i in group])
        displacement=pp4_dist(c1,start_center)
        residual=pp4_dist(c1,tuple(start_center[d]+drift[d] for d in range(3)))
        relative_shape_change=math.sqrt(
            sum(sum(((new[i]["position"][d]-c1[d])-(old[i]["position"][d]-start_center[d]))**2
                    for d in range(3)) for i in group)/len(group))
        body_old=[old[i] for i in group if old[i]["info"]==0 and i!=1]
        body_new=[new[i] for i in group if new[i]["info"]==0 and i!=1]
        if not body_old or len(body_old)!=len(body_new):continue
        neural_old=[x for x in body_old if x["neural_flag"]==1]
        neural_new=[x for x in body_new if x["neural_flag"]==1]
        def nn_mean(items,name):
            return statistics.mean(x[name] for x in items) if items else None
        light0=statistics.mean(x["light_r"]+x["light_g"]+x["light_b"] for x in body_old)/3
        light1=statistics.mean(x["light_r"]+x["light_g"]+x["light_b"] for x in body_new)/3
        rec={
          "size":len(group),
          "region_x":quartile(start_center[0],cuts_x),
          "region_z":quartile(start_center[2],cuts_z),
          "cohort_centroid_displacement":displacement,
          "centroid_displacement_minus_world_drift":residual,
          "shape_relative_rms":relative_shape_change,
          "source_velocity_mean_t0":statistics.mean(math.sqrt(sum(v*v for v in old[i]["velocity"])) for i in group),
          "source_velocity_mean_t1":statistics.mean(math.sqrt(sum(v*v for v in new[i]["velocity"])) for i in group),
          "body_energy_mean_delta":statistics.mean(y["energy"]-x["energy"] for x,y in zip(body_old,body_new)),
          "body_energy_mean_t0":statistics.mean(x["energy"] for x in body_old),
          "body_energy_mean_t1":statistics.mean(x["energy"] for x in body_new),
          "light_intensity_mean_t0":light0,"light_intensity_mean_t1":light1,
          "neural_active_cells_t0":len(neural_old),
          "neural_active_cells_t1":len(neural_new),
          "neural_inputs_nonzero_frac_t0":nn_mean(neural_old,"sensor_vector_nonzero_fraction"),
          "neural_inputs_nonzero_frac_t1":nn_mean(neural_new,"sensor_vector_nonzero_fraction"),
          "neural_outputs_mean_abs_t0":nn_mean(neural_old,"effector_vector_mean_abs"),
          "neural_outputs_mean_abs_t1":nn_mean(neural_new,"effector_vector_mean_abs"),
          "source_eat_flag_count_t0":sum(x["eat_flag"]==1 for x in body_old),
          "source_eat_flag_count_t1":sum(x["eat_flag"]==1 for x in body_new),
          "source_hit_cell_flag_count_t0":sum(x["hit_cell_flag"]==1 for x in body_old),
          "source_hit_cell_flag_count_t1":sum(x["hit_cell_flag"]==1 for x in body_new),
          "source_light_flag_count_t0":sum(x["light_flag"]==1 for x in body_old),
          "source_light_flag_count_t1":sum(x["light_flag"]==1 for x in body_new),
          "book_same_fraction":sum(old[i]["book_sha"]==new[i]["book_sha"] for i in group)/len(group),
          "NN_w1_same_fraction":sum(old[i]["neural_w1_sha"]==new[i]["neural_w1_sha"] for i in group)/len(group),
          "NN_w2_same_fraction":sum(old[i]["neural_w2_sha"]==new[i]["neural_w2_sha"] for i in group)/len(group)
        }
        records.append(rec)
    values=[
      "cohort_centroid_displacement","centroid_displacement_minus_world_drift",
      "shape_relative_rms","source_velocity_mean_t0","source_velocity_mean_t1",
      "body_energy_mean_delta","body_energy_mean_t0","body_energy_mean_t1",
      "light_intensity_mean_t0","light_intensity_mean_t1",
      "neural_inputs_nonzero_frac_t0","neural_inputs_nonzero_frac_t1",
      "neural_outputs_mean_abs_t0","neural_outputs_mean_abs_t1",
      "neural_active_cells_t0","neural_active_cells_t1",
      "source_eat_flag_count_t0","source_eat_flag_count_t1",
      "source_hit_cell_flag_count_t0","source_hit_cell_flag_count_t1",
      "source_light_flag_count_t0","source_light_flag_count_t1",
      "book_same_fraction","NN_w1_same_fraction","NN_w2_same_fraction"
    ]
    def aggregate(items):
        return {key:pp4_percentiles([z[key] for z in items if z[key] is not None]) for key in values}
    by_size={str(k):{"count":sum(x["size"]==k for x in records),
                        "metrics":aggregate([x for x in records if x["size"]==k])}
             for k in (2,3,4,5)}
    by_region=[]
    for k in range(4):
        for v in range(4):
            samples=[x for x in records if x["region_x"]==k and x["region_z"]==v]
            by_region.append({"quartile_x":k,"quartile_z":v,"count":len(samples),
               "displacement":pp4_percentiles([x["cohort_centroid_displacement"] for x in samples]),
               "residual_displacement":pp4_percentiles([x["centroid_displacement_minus_world_drift"] for x in samples]),
               "energy_change":pp4_percentiles([x["body_energy_mean_delta"] for x in samples])})
    return {
       "from":src["t"],"to":dst["t"],"matched_original_2to5_units":len(records),
       "sampled_source_2to5_units":len(initial_groups),
       "global_same_aged_non_sun_cell_translation":list(drift),
       "quartile_X_cuts":cuts_x,"quartile_Z_cuts":cuts_z,
       "distribution_all_matching_units":aggregate(records),
       "by_original_group_size":by_size,"by_original_XZ_quartile":by_region,
       "source_bodies_with_neural_activity_t0":sum(x["neural_active_cells_t0"]>0 for x in records),
       "source_bodies_with_neural_activity_t1":sum(x["neural_active_cells_t1"]>0 for x in records),
       "fraction_constant_book_whole_body":(sum(x["book_same_fraction"]==1 for x in records)/len(records)
                                            if records else None),
       "interpretation":"Observational displacement/energy/activity differences, no learning, behavioral strategies or causal world affordances established",
       "baseline_limit":"Global cohort center drift is not a physics-control, sensor-null or matched environment"
    }

try:
    metadata=json.loads(AUDIT.read_text(encoding="utf-8"))
    if not metadata.get("science_qualified"):
        raise AssertionError("cannot audit PP2 without source-qualified original snapshots")
    loaded=[parse_native_file(t) for t in STEPS]
    for state in loaded:
        t=state["t"]
        # Source praparat.f90: step() emits diagnostics at the BEGINNING of each
        # update, while main.f90 writes native state AFTER step(80).
        # Therefore original saved t80 matches log WORLD_STEP=81 (and t160→161).
        # t240 has no step241 log in this 240-step run; never compare to t240's
        # pre-update diagnostic and falsely disqualify an intact source snapshot.
        compared_to_world_step=t+1 if t<240 else None
        expected=(metadata["run"]["sampled_original_counters"].get(str(compared_to_world_step),{})
                  if compared_to_world_step is not None else {})
        summary=state["summary"]
        summary["aligned_pre_update_world_step"]=compared_to_world_step
        summary["source_check_active_cells"]=expected.get("CALC_CLL")
        summary["source_check_spring_edges"]=expected.get("CONN_CLL")
        summary["source_check_info_cells"]=expected.get("NUMBER_OF_INFO_TRANS")
        summary["active_count_matches_original_log"]=(summary["source_active_slots"]==expected.get("CALC_CLL")
            if compared_to_world_step is not None else None)
        summary["edge_count_matches_original_log"]=(summary["unique_undirected_edges"]==expected.get("CONN_CLL")
            if compared_to_world_step is not None else None)
        summary["info_count_matches_original_log"]=(summary["source_information_cells"]==expected.get("NUMBER_OF_INFO_TRANS")
            if compared_to_world_step is not None else None)
        report["snapshots"].append({"step":t,**summary})
    # A host-only identity link is deliberately stricter than a recycled cell slot.
    report["cohort_transitions"]=[cohort_continuity(loaded[a],loaded[b])
                                  for a,b in ((0,1),(1,2),(0,2))]
    report["all_fragment_cohort_transitions"]=[complete_fragment_cohort(loaded[a],loaded[b])
                                  for a,b in ((0,1),(1,2),(0,2))]
    report["pp4_functional_cohorts"]=[pp4_functional_cohort(loaded[a],loaded[b])
                                  for a,b in ((0,1),(1,2),(0,2))]
    report["integrity"]={
        "source_cell_count_matches":all(x["active_count_matches_original_log"] is True for x in report["snapshots"] if x["aligned_pre_update_world_step"] is not None),
        "source_edge_count_matches":all(x["edge_count_matches_original_log"] is True for x in report["snapshots"] if x["aligned_pre_update_world_step"] is not None),
        "source_info_count_matches":all(x["info_count_matches_original_log"] is True for x in report["snapshots"] if x["aligned_pre_update_world_step"] is not None),
        "all_link_targets_real":all(x["invalid_link_target_count"]==0 for x in report["snapshots"]),
        "all_links_reciprocal":all(x["nonreciprocal_directed_link_count"]==0 for x in report["snapshots"])
    }
    report["status"]="SOURCE_NATIVE_GRAPH_STREAM_PARSED"
    report["science_qualified"]=all(report["integrity"].values())
    report["integrity"]["source_step_240_not_directly_crosschecked"]=True
    report["interpretation"]="Source spring networks contain many small components; age-consistent slots indicate cell continuity, not organism-level individuality."
except Exception as e:
    report["status"]="SOURCE_NATIVE_GRAPH_AUDIT_INCONCLUSIVE"
    report["error_type"]=type(e).__name__
    report["error"]=str(e)[:370]
finally:
    DEST.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("RB_PP3_LINEAGE "+json.dumps(report,ensure_ascii=False)[:17500])
    if report.get("pp4_functional_cohorts"):
        print("RB_PP4_FUNCTIONAL "+json.dumps([
           {"from":x["from"],"to":x["to"],
            "matched":x["matched_original_2to5_units"],
            "total":x["sampled_source_2to5_units"],
            "drift":x["global_same_aged_non_sun_cell_translation"],
            "medians":{key:value["median"] for key,value in x["distribution_all_matching_units"].items()},
            "sizes":{k:{"count":v["count"],
                        "displacement":v["metrics"]["cohort_centroid_displacement"],
                        "energy_delta":v["metrics"]["body_energy_mean_delta"],
                        "nn_output":v["metrics"]["neural_outputs_mean_abs_t1"]}
                     for k,v in x["by_original_group_size"].items()},
            "neurally_active":[x["source_bodies_with_neural_activity_t0"],
                               x["source_bodies_with_neural_activity_t1"]],
            "constant_book_fraction":x["fraction_constant_book_whole_body"]}
            for x in report["pp4_functional_cohorts"]],ensure_ascii=False))
    if report.get("all_fragment_cohort_transitions"):
        print("RB_PP3_FRAGMENT_SUMMARY "+json.dumps([
           {"from":x["from"],"to":x["to"],
            "size_bands":x["original_component_size_counts"],
            "units":x["all_multicell_source_unit_summary"],
            "by_size":x["multicell_by_original_size"],
            "preserved_edges":x["native_spring_edges_preserved"],
            "eligible_edges":x["native_edges_whose_endpoints_age_consistent"],
            "retention":x["spring_retention_given_both_aged"],
            "recipient_components_with_multiple_origins":x["later_components_with_descendants_from_multiple_multicell_origins"]}
            for x in report["all_fragment_cohort_transitions"]],ensure_ascii=False))
if report["status"]!="SOURCE_NATIVE_GRAPH_STREAM_PARSED":
    raise SystemExit("PP3 parser did not qualify: inspect native JSON audit")
if not report.get("science_qualified"):
    raise SystemExit("PP3 original source count mismatch: do NOT promote lineage results")
