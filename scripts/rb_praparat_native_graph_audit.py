#!/usr/bin/env python3
"""PP3: stream ORIGINAL Fortran 42-line cell records, never load 360MB snapshot.

Host-only topology/continuity diagnostic; no manipulation of cell state.
Source: A5size/OpenPraparat@e9e105d48ab597612d1749a5f169663559b12287
      src/praparat.f90 write_cell_into_one, lines 2108-2207.
"""
from __future__ import annotations
import collections, hashlib, json, pathlib, tarfile

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
    needed={15:"energy",17:"internal_id",18:"age",26:"ccf",27:"iocc",36:"info"}
    for field in range(4,FIELDS):
        line=fp.readline()
        if not line:raise ValueError(f"truncated cell {i}, field {field}")
        if not exist or field not in needed:continue
        kind=needed[field]
        if kind in ("ccf","iocc"):state[kind]=values_int(line,8)
        elif kind=="energy":state[kind]=float_first(line)
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
