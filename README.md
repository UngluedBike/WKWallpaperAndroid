# Wanikani Progress Wallpaper (Tasker)
Based on the [scriptable project](https://community.wanikani.com/t/ios-auto-updating-kanji-progress-wallpaper/52943) by maboesanman on WaniKani. Be sure to go thank them for creating this!

I thought it was a really cool project that deserved to have an Android version, since Scriptable is iOS only.


# Setup
Import the durtles_profile.prf.xml profile into Tasker (Import button is accessed by tapping the Profiles tab whilst viewing profiles).

Navigate to the tasks tab. Click on the "Update Wallpaper" task, and adjust the following actions:

Place the updatewallpaper.js file into the tasker folder in your internal storage (This is the default path).
Alternatively, place the script in your desired location and adjust the filepath:

![Screenshot showing the script path](/images/script_path.png ".js file path")

Set the api_key variable to your WaniKani V2 API key:

![Screenshot showing API key setting](/images/api_key.png "API Key")

Optionally, you can set the buffers to any amount in pixels, if your phone has curved edges or anything else that may obscure your view of the wallpaper. This can be adjusted in the variable screen_buf, values are comma separated. Take care not to include spaces. Order is top, bottom, left, right.

![Screenshot showing buffer variable](/images/buffer_variable.png "Buffer variable")

Here is an example. Below is with the buffer values all set to 0.

![Screenshot showing wallpaper with no buffer](/images/example_nobuffer.png "No buffer example")

And here is the wallpaper with the top and bottom buffers set to 500, and the left and right set to 200.

![Screenshot showing wallpaper with buffer](/images/example_buffer.png "Buffer example")

# Extra Configuration
You can also change the "Set Wallpaper" action to change your home screen, or both wallpapers if you wish.
# Removal

Aside from deleting the task, profile and script, there is a folder that will be generated to store your WaniKani data, as well as the most recently created wallpaper. The folder is called wkcache and is placed in the root of your internal storage. I may add a variable so this can be customised later.

# Future Updates
The only thing I wish to improve right now is the font, but please raise an issue if you want to ask for a feature.