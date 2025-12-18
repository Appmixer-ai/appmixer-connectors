#!/bin/bash

if [ -d ./dist ]; then
  echo "Removing old packages from ./dir"
  rm -rf ./dist/appmixer.*.zip
else
  echo "Creating ./dir"
  mkdir ./dist;
fi

cwd=$(pwd)

for serviceDir in `ls -d ./src/appmixer/*`; do

  if [ "$serviceDir" = "./src/appmixer/MongoDb" ]; then
    continue
  fi

  # Check if the service has modules and pack them individually

  moduleFiles=`find ${serviceDir}/*/module.json 2>/dev/null`
  for moduleFile in $moduleFiles; do

    moduleDir="$(dirname ${moduleFile})"
    bundleFile="$moduleDir/bundle.json"

    if test -f "$bundleFile" || test "$1" = "all" ; then
      echo "Packing: $moduleDir"
      appmixer pack $moduleDir

      if [ $status -ne 0 ]; then
        echo "Error while creating zip for " "$moduleDir"
        cd "$cwd" || exit
        continue
      fi

      echo "Moving zip file into 'dist' directory"
      mv appmixer.*.*.zip "$cwd"/dist || exit;
      cd "$cwd" || exit
    fi

  done

  bundleFile="$serviceDir/bundle.json"

  if test -f "$bundleFile" || test "$1" = "all" ; then
    echo "Packing " "$serviceDir"
    cd "$serviceDir" || exit;
    appmixer pack

    status=$?

    if [ $status -ne 0 ]; then
      echo "Error while creating zip for " "$serviceDir"
      cd "$cwd" || exit
      continue
    fi

    echo "Moving zip file into 'dist' directory"
    mv appmixer.*.zip "$cwd"/dist || exit;
    cd "$cwd" || exit
  fi

done

for serviceDir in `ls -d ./src/test/*`; do

  moduleFiles=`find ${serviceDir}/*/module.json 2>/dev/null`
  for moduleFile in $moduleFiles; do

    moduleDir="$(dirname ${moduleFile})"
    bundleFile="$moduleDir/bundle.json"

    if test -f "$bundleFile" || test "$1" = "all" ; then
      echo "Packing: $moduleDir"
      appmixer pack $moduleDir

      if [ $status -ne 0 ]; then
        echo "Error while creating zip for " "$moduleDir"
        cd "$cwd" || exit
        continue
      fi

      echo "Moving zip file into 'dist' directory"
      mv test.*.*.zip "$cwd"/dist || exit;
      cd "$cwd" || exit
    fi

  done

  bundleFile="$serviceDir/bundle.json"

  if test -f "$bundleFile" || test "$1" = "all" ; then
    echo "Packing " "$serviceDir"
    cd "$serviceDir" || exit;
    appmixer pack;

    status=$?

    if [ $status -ne 0 ]; then
      echo "Error while creating zip for " "$serviceDir"
      cd "$cwd" || exit
      continue
    fi

    echo "Moving zip file into 'dist' directory"
    mv test.*.zip "$cwd"/dist || exit;
    cd "$cwd" || exit
  fi

done
