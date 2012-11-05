#!/bin/bash

PORT=9000
NUM_CLIENTS=10
DURATION=60
REPORT_INTERVAL=10

set -e
trap "echo XXX FAILED" EXIT

PROJDIR=`dirname $0`
cd "$PROJDIR"

# start the benchmark app
../../../meteor --production --port 9000 &
OUTER_PID=$!


# start a bunch of phantomjs processes
PHANTOMSCRIPT=`mktemp -t benchmark-XXXXXXXX`
cat > "$PHANTOMSCRIPT" <<EOF
var page = require('webpage').create();
var url = 'http://localhost:$PORT';
page.open(url);
EOF
for ((i = 0 ; i < $NUM_CLIENTS ; i++)) ; do
    sleep 1
    phantomjs "$PHANTOMSCRIPT" &    # XXX save pid to kill later
done

for ((i = 0 ; i < $DURATION/$REPORT_INTERVAL ; i++)) ; do
    sleep $REPORT_INTERVAL
    echo REPORT
done

kill -INT $OUTER_PID
# XXX kill by pid
killall phantomjs

rm "$PHANTOMSCRIPT"

trap - EXIT

