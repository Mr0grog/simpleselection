SRC_DIR = src
BUILD_DIR = build
PREFIX = .
DIST_DIR = ${PREFIX}/dist
DOCS_DIR = ${PREFIX}/docs

DIST_HEADER = ${SRC_DIR}/_header.js

CORE_FILES = ${SRC_DIR}/SimpleRange.js\
	${SRC_DIR}/SimpleSelection.js

OUT_NORM = ${DIST_DIR}/SimpleSelection.js
OUT_MIN = ${DIST_DIR}/SimpleSelection.min.js

COMPRESSOR = java -jar ${BUILD_DIR}/yuicompressor-2.4.2.jar



build: clean simpleselection event_standard compress

jquery: clean simpleselection event_jquery compress

simpleselection: ${DIST_HEADER} ${CORE_FILES}
	@@echo "Building SimpleSelection"

	@@mkdir -p ${DIST_DIR}
	@@cat ${DIST_HEADER} ${CORE_FILES} > ${OUT_NORM}

	@@echo " -Built."

event_standard:
	@@cat ${SRC_DIR}/providers/SimpleSelection.standard.js >> ${OUT_NORM}
	@@echo " -Added standard events."

event_jquery:
	@@cat ${SRC_DIR}/providers/SimpleSelection.jQuery.js >> ${OUT_NORM}
	@@echo " -Added jQuery events hook."

compress:
	@@echo "Compressing using YUI Compressor 2.4.2 ..."
	@@${COMPRESSOR} ${OUT_NORM} > ${OUT_MIN}.tmp
	@@cat ${DIST_HEADER} ${OUT_MIN}.tmp > ${OUT_MIN}
	@@rm ${OUT_MIN}.tmp
	@@echo " -Done."

clean:
	@@rm -rf ${DIST_DIR}/*