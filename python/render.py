import sys
import os
import json
import bpy

is_28 = bpy.app.version[1] >= 80
render_engine = bpy.context.scene.render.engine

params = json.loads(sys.argv[sys.argv.index('--') + 1])

if render_engine == 'CYCLES':
  preferences = bpy.context.preferences if is_28 else bpy.context.user_preferences

  # enable CUDA GPU rendering
  preferences.addons['cycles'].preferences['compute_device_type'] = 1
  bpy.context.scene.cycles.device = 'GPU'

  # use only the given devices
  devices = preferences.addons['cycles'].preferences.get_devices()[0]

  for i in range(len(devices)):
    devices[i].use = (i in params['devices'])

is_animation = bool(params['type'] == 'animation')

file_path = os.path.join(params['outputFolder'], params['fileName'])
if is_animation:
    file_path += '-'

render = bpy.context.scene.render

'''OPTIONS'''
# file type
render.image_settings.file_format = 'PNG'
# set render path
render.filepath = file_path
# if a frame already exists, don't re-render it
render.use_overwrite = False
# if you started rendering a frame, make an empty file for it so that other nodes know you're taking care of it
render.use_placeholder = True
if is_animation:
  # keep render data around for faster re-render
  render.use_persistent_data = True

'''RENDER'''
# render and write ouput to render path automatically
bpy.ops.render.render(animation=is_animation, write_still=True)
