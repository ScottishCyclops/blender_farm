import sys
import os
import json
import bpy

params = json.loads(sys.argv[sys.argv.index('--') + 1])

devices = bpy.context.user_preferences.addons['cycles'].preferences.get_devices()[0]

# use only the given devices
for i in range(len(devices)):
  devices[i].use = (i in params['devices'])

is_animation = bool(params['type'] == 'animation')

file_path = os.path.join(params['outputFolder'], params['fileName'])
if is_animation:
    file_path += '-'

Render = bpy.context.scene.render

'''OPTIONS'''
# file type
Render.image_settings.file_format = 'PNG'
# set render path
Render.filepath = file_path
# if a frame already exists, don't re-render it
Render.use_overwrite = False
# if you started rendering a frame, make an empty file for it so that other nodes know you're taking care of it
Render.use_placeholder = True
if is_animation:
  # keep render data around for faster re-render
  Render.use_persistent_data = True

'''RENDER'''
# render and write ouput to render path automatically
bpy.ops.render.render(animation=is_animation, write_still=True)
