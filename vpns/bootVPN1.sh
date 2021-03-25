#!/bin/bash
sudo killall openvpn
echo OpenVPN script for server 1 starting...
cd /home/pi/Bots/Market-Bot/vpns
sudo openvpn us-free-01.protonvpn.com.udp.ovpn