#!/bin/bash
wc -l \
	fakeyou/src/*css \
	fakeyou/src/*ts* \
	fakeyou/src/*/*ts* \
	fakeyou/src/*/*/*ts* \
	fakeyou/src/*/*/*/*ts* \
	fakeyou/src/*/*/*/*/*ts* \
	fakeyou/src/*/*/*/*/*/*ts* \
	| sort -n
