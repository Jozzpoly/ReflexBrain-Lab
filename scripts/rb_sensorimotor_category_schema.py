"""Bounded JSON *schema* audit of authors' public category metadata.

Not a trained-parameter loader; never pickle/torch.load any external files.
"""
import json, pathlib, urllib.request
SOURCE_SHA="f29a064f8bc18877269df56661a290fc29e485bb"
URL=("https://raw.githubusercontent.com/flowersteam/sensorimotor-lenia-search/"
     +SOURCE_SHA+"/data/creatures_categories_init.json")
out={"source_sha":SOURCE_SHA,"url":URL,"status":"UNKNOWN",
     "read_limit_bytes":2_000_000,"executed_external_files":0}
try:
    req=urllib.request.Request(URL,headers={"User-Agent":"ReflexBrain-Research/1.0"})
    with urllib.request.urlopen(req,timeout=20) as r:
        content=r.read(2_000_001)
    if len(content)>2_000_000:raise ValueError("declared bound exceeded")
    data=json.loads(content)
    records=list(data.values()) if isinstance(data,dict) else data
    if not isinstance(records,list): raise ValueError("unexpected metadata shape")
    out["status"]="METADATA_PARSED"
    out["bytes"]=len(content)
    out["top_type"]=type(data).__name__
    out["entries"]=len(records)
    out["top_names"]=list(data)[:4] if isinstance(data,dict) else []
    out["sample_fields"]=sorted(records[0].keys()) if records and isinstance(records[0],dict) else []
    pointers=[]
    forms={}
    for rec in records:
        if not isinstance(rec,dict):continue
        for key,val in rec.items():
            if any(term in key.lower() for term in ("parameter","policy","initializ","update","filepath","stats")):
                forms.setdefault(key,{})
                typ=type(val).__name__
                forms[key][typ]=forms[key].get(typ,0)+1
                if len(pointers)<12:
                    pointers.append({"key":key,"type":typ,
                        "sample":str(val)[:220] if isinstance(val,str) else
                        ("dict_keys:"+",".join(list(val.keys())[:8]) if isinstance(val,dict) else
                         "list_len:"+str(len(val)) if isinstance(val,list) else str(val)[:100])})
    out["candidate_field_types"]=forms
    out["candidate_samples"]=pointers
except Exception as e:
    out["status"]="METADATA_UNAVAILABLE"
    out["error_type"]=type(e).__name__
    out["error"]=str(e)[:200]
p=pathlib.Path("artifacts/donors/sensorimotor_metadata_schema.json")
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(out,indent=2),encoding="utf-8")
print("RB_SML_CATEGORY_SCHEMA "+json.dumps(out))
