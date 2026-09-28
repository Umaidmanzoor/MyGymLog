"""Fetch explicitly mapped public-domain photo steps and create 4-second step loops.
Run manually; regular builds use the checked-in assets and never access this source.
"""
import json,re,urllib.request,concurrent.futures,subprocess,time
from pathlib import Path
BASE='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/'
root=Path(__file__).resolve().parent.parent
source=(root/'src/db/seed.ts').read_text().split('export const slug')[0]
names=re.findall(r'^    "([^"]+)",',source,re.M)
mapper=json.loads((root/'scripts/demo-map.json').read_text())
mapper.update({'Side Plank':'Side Bridge','Walking Lunge':'Bodyweight Walking Lunge','Single-Leg Romanian Deadlift':'Kettlebell One-Legged Deadlift'})
original={'Hollow Body Hold','Bayesian Cable Curl','Single-Arm Cable Press','Lean-Away Lateral Raise','Y Raise','Pike Push-Up','Cross-Body Cable Extension','Landmine Press'}
data=json.loads(Path('/tmp/coral-exercises.json').read_text())
lookup={e['name']:e for e in data}
def get(url,path):
 if path.exists():return
 for attempt in range(4):
  try:
   with urllib.request.urlopen(url,timeout=30) as response:content=response.read()
   path.write_bytes(content);return
  except Exception:
   if attempt==3:raise
   time.sleep(attempt+1)
def process(name):
 if name in original:return None
 target=mapper.get(name,name)
 if target not in lookup:raise RuntimeError('Unmapped: '+name)
 entry=lookup[target];slug=re.sub('[^a-z0-9]+','-',name.lower()).rstrip('-')
 folder=root/'public/demos'/slug;folder.mkdir(parents=True,exist_ok=True)
 images=[]
 for i,image in enumerate(entry['images'][:2]):
  path=folder/f'{i}.jpg';get(BASE+'exercises/'+urllib.parse.quote(image),path);images.append(f'demos/{slug}/{i}.jpg')
 if len(images)!=2:raise RuntimeError('Need two steps: '+name)
 loop=folder/'loop.mp4'
 if not loop.exists():
  subprocess.run(['ffmpeg','-v','error','-y','-framerate','1/2','-i',str(folder/'%d.jpg'),'-t','4','-vf','scale=480:360:force_original_aspect_ratio=decrease,pad=480:360:(ow-iw)/2:(oh-ih)/2:white,setsar=1','-r','24','-c:v','libx264','-crf','27','-pix_fmt','yuv420p','-movflags','+faststart',str(loop)],check=True)
 return slug,{'sourceName':target,'kind':'photo-steps','images':images,'video':f'demos/{slug}/loop.mp4','muscles':entry['primaryMuscles'],'steps':entry['instructions'],'sourceURL':'https://github.com/yuhonas/free-exercise-db/tree/main/exercises/'+entry['id']}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 results=list(pool.map(process,names))
manifest=dict(x for x in results if x)
(root/'src/data/demos.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'public/licenses').mkdir(exist_ok=True)
get(BASE+'LICENSE.md',root/'public/licenses/free-exercise-db.txt')
print(f'Saved {len(manifest)} photo demonstrations; {len(original)} original guides to render.')
