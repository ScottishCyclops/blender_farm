import bpy
import json

devices = bpy.context.user_preferences.addons['cycles'].preferences.get_devices()[0]

print('render_farm_data={}'.format(json.dumps(len(devices))))
