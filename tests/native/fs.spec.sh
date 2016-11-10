#!/bin/bash

if [ ! -e mnt ]; then
  mkdir mnt
fi

echo "OK - Created mount dir"
env node tests/native/index.js > /dev/null &

DRIVE_PID=$!

if [ $DRIVE_PID -ge 0 ]; then
  echo "OK - Running octo-drive"
else
  echo "ERR - Cannot run octo-drive"
  exit -1
fi

touch mnt/.waiting
while ( [ -e mnt/.waiting ] ) ; do
  sleep 1;
done;

echo "OK - Filesystem mounted"


#
#     Test file creation

echo "Hello World" > mnt/hello.txt

if [ ! -e mnt/hello.txt ]; then 
  echo "ERR - Cannot create mnt/hello.txt"
  exit 1 
else
  echo "OK - Created mnt/hello.txt"
fi

#
#   Test read created file

HELLO=`cat mnt/hello.txt`

if [ "$HELLO" != "Hello World" ]; then
  echo "ERR - Wrong file content"
  exit 1
else
  echo "OK - File read mnt/hello.txt"
fi

#
#  Test directory creation

mkdir mnt/hello
echo "hello" > mnt/hello/hello.txt

HELLO=`cat mnt/hello/hello.txt`

if [ "$HELLO" != "hello" ]; then
  echo "ERR - Cannot read mnt/hello/hello.txt"
  exit 1
else
  echo "OK - Created dir hello with file hello.txt"
fi

#
#  Remove file

rm mnt/hello/hello.txt

if [ -e mnt/hello/hello.txt ]; then
  echo "ERR - Cannot remove mnt/hello/hello.txt"
  exit 1
else
  echo "OK - Remove mnt/hello/hello.txt"
fi

#
#   Recursively create
mkdir -p mnt/hello/test/ooo
touch mnt/hello/dddd
touch mnt/hello/test/pppp

if [ ! -e mnt/hello/test/ooo ]; then
  echo "ERR - Cannot recursively create dir"
  exit 1
else
  echo "OK - Recursively created dir"
fi

#
#   Recursively remove

rm -fr mnt/hello

if [ -e mnt/hello ]; then
  echo "ERR - Cannot recursively remove mnt/hello"
  exit 1
else 
  echo "OK - Recursive remove mnt/hello"
fi

#
# Test readdir

touch mnt/file1
touch mnt/file2
LSLEN=`ls -l mnt/ | grep file | wc -l`

if [ $LSLEN -ne 2 ]; then
  echo "ERR - Reddir filed, wrond list numbder"
  exit 1
else
  echo "OK - Readdir just fine"
fi

#
#   Move test
mv mnt/file1 mnt/file1-moved
mv mnt/file2 mnt/file2-moved
LSLEN=`ls -l mnt/ | grep moved | wc -l`

if [ $LSLEN -ne 2 ]; then 
  echo "ERR - Move filed"
  exit 1
else
  echo "OK - Files moved"
fi

#
# Links 

ln -s mnt/file1-moved mnt/file1-link
ln -s mnt/file2-moved mnt/file2-link
LSLEN=`ls -l mnt/ | grep link | wc -l`

if [ $LSLEN -ne 2 ]; then 
  echo "ERR - Symlinks failed"
  exit 1
else
  echo "OK - Symlinks created"
fi


kill -INT $DRIVE_PID

wait $DRIVE_PID


rm mnt/.waiting
