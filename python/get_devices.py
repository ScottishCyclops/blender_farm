import bpy
import json

is_28 = bpy.app.version[1] >= 80

preferences = bpy.context.preferences if is_28 else bpy.context.user_preferences
devices = preferences.addons['cycles'].preferences.get_devices()[0]

print('render_farm_data={}'.format(json.dumps(len(devices))))
