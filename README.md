# Blender Farm

*A fully fledged remote blender farm written in NodeJS*

This personnal project of mine is a server designed to be deployed on my home serveur.
It runs multiple GPUs for 3D Rendering with Blender, and I need a way to automate rendering jobs from my workstation.

I will try my best to make it configurable so that anyone could technically deploy it on their own server.
Please [email me](https://github.com/ScottishCyclops) if you have questions. For suggestions, use the [Github issues](https://github.com/ScottishCyclops/blender_farm/issues).

## Installing the project

Quick procedure to install the project on any Unix system.

Recommanded OS: Any Ubuntu-based distrubution, 18.04 and above.
You will need a graphical interface in order for Blender to accept rendering, even if the server then runs headless.

### Install the latest Node and Yarn releases

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
bash  # reload terminal
nvm install --lts
curl -o- -L https://yarnpkg.com/install.sh | bash
bash  # reload terminal
node -v  # verify installation
yarn -v  # verify installation
```

### Clone the project

Go in the parent folder where you want the project to live.

```bash
git clone https://github.com/ScottishCyclops/blender_farm
cd blender_farm
yarn  # install the dependencies
```

### Configure it

Create the file __config.json__ at the root of the project. In your favorite editor, write something similar to the following.
Under *blenderExec*, write the actual path to your blender executable. The rest can be left as is.

```json
{
  "certPath": "/ssl/blender.local.crt",
  "keyPath": "/ssl/blender.local.key",
  "port": 4434,
  "blenderExec": "/usr/sbin/blender"
}
```

Generate a self-signed certificate. Press Enter until the end, no need to input anything.

You will need the *openssl* command line utility (installed by default on most Linux platforms).

```bash
yarn genkeys
```

### Start it

```bash
yarn start
```


Hope you have fun with it !

Scott
