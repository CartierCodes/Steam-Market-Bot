#!/bin/bash
sudo killall openvpn
echo OpenVPN script for server 3 starting...
cd /home/pi/Bots/Market-Bot/vpns
sudo openvpn us-free-03.protonvpn.com.udp.ovpn