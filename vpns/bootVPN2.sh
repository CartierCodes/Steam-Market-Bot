#!/bin/bash
sudo killall openvpn
echo OpenVPN script for server 2 starting...
cd /home/pi/Bots/Market-Bot/vpns
sudo openvpn us-free-02.protonvpn.com.udp.ovpn