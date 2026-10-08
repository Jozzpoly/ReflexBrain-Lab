"""Static figure from measured physics; run after the braking-trace TS probe."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path(__file__).resolve().parents[1]
r=json.loads((root/'evidence/living-organism/touch-braking-trace.json').read_text())
fig,axs=plt.subplots(3,1,figsize=(10,6),sharex=True,layout='constrained')
colors={'interrupted':'#65758b','interrupted-cancel':'#d39a2b','interrupted-brake':'#118e72'}
labels={'interrupted':'Zerowa komenda po cofnięciu','interrupted-cancel':'Anulowanie po nowym dotyku','interrupted-brake':'Hamowanie z propriocepcji'}
for e in r['episodes']:
 rows=[s for s in e['samplesTrace'] if s['tick']<=480]
 t=[s['tick']/120 for s in rows]
 for ax,key in zip(axs,['x','forward','drive']):
  ax.plot(t,[s[key] for s in rows],label=labels[e['policy']],color=colors[e['policy']],lw=1.8,ls='--' if e['policy']=='interrupted-cancel' else '-')
 hits=[s for s in rows if s['rearImpulse']>0]
 if hits:axs[0].scatter([s['tick']/120 for s in hits],[s['x'] for s in hits],marker='x',s=34,color='#c64444',zorder=5)
axs[0].axhline(-.03,color='#c64444',ls=':',lw=1)
axs[0].text(3.9,-.029,'granica kontaktu z tyłu',ha='right',va='bottom',fontsize=9,color='#a13333')
for ax,label in zip(axs,['Położenie ciała x [m]','Prędkość przód/tył [m/s]','Komenda napędu']):
 ax.set_ylabel(label);ax.grid(alpha=.18);ax.axhline(0,color='#a8aeb6',lw=.6)
axs[0].legend(loc='upper center',ncol=1,fontsize=9,framealpha=.9)
axs[-1].set_xlabel('Czas [s]');axs[-1].set_xlim(0,4)
fig.suptitle('Zerowa komenda nie zatrzymuje pędu',fontsize=16,fontweight='bold')
fig.text(.51,-.025,'Wąska przestrzeń, siła zewnętrzna 1.5. Czerwone ×: rzeczywisty kontakt z tyłu. Test regulatora, nie całego brainu.',ha='center',fontsize=9)
fig.savefig(root/'evidence/living-organism/touch-braking.png',dpi=160,bbox_inches='tight')
