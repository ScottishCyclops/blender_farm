import bpy
import json

print('render_farm_data={}'.format(json.dumps({ 'startFrame': bpy.context.scene.frame_start, 'endFrame': bpy.context.scene.frame_end, 'engine': bpy.context.scene.render.engine })))
