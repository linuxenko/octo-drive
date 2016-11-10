### OCTO-DRIVE 

[![npm version](https://img.shields.io/npm/v/octo-drive.svg)](https://www.npmjs.com/package/octo-drive) [![Build Status](https://travis-ci.org/linuxenko/octo-drive.svg?branch=master)](https://travis-ci.org/linuxenko/octo-drive)

`octo-drive` helps you turn github repository into enctypted filesystem. It is 
based on `fuse` (`fuse-bindings` for node) that helps create userspace filesystems.

### Features
  * Encrypts every file with your password
  * Encrypts filesystem metadata
  * Enctypts filenames inside of repository
  * Each file is encrypted repository file (reduce network things).
  * Encrypted local cache to make it a bit faster
  * Fast enough for download and upload

### Usage

Dependency

#### `sudo apt-get install libfuse-dev`

`fuse-bindings` is depend on `libfuse-dev` when installing with `node-gyp`

How to install ?

#### `npm install -g octo-drive`

How to run ?

#### `octo-drive githubuser/myrepository ~/drive`

Will mount repository `mysrepository` of `githubuser` into `~/drive`

When you run the `octo-drive`, it will ask some questions

  * Do you like authorize with github token ?
  * Token themselfs
  * or user password for your account

Then it will ask about `drive secret`, all the data will be encoded
with this `secret`.

**Ok , what about more automation ?**

There is a bunch of `ENV`ironment variables that can help with it

  * `OCTODRIVE_TOKEN`
  
or

  * `OCTODRIVE_USER`
  * `OCTODRIVE_PASS`
  
and

  * `OCTODRIVE_SECRET`

Idk how much it secure setup envs with plain passwords, but it can 
be supersecret script inside of the supersecret place that run `octo-drive`
with these variables.

**Is it really secure ?**

Huh ? Me ? I don't know, tell me please if you have something to say about it.

### Bugz..z.. Features !

`octo-drive` can handle different filesystems for just different secrets ;)

### License

BSD
