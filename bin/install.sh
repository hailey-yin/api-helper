echo "budrest install ing................."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
#for easy_install
sudo yum -y install python-setuptools
#install supervisor
sudo easy_install supervisor
#create supervisor upstart script
(cat $DIR/config/budrest-supervisor.conf ; echo "exec /usr/bin/supervisord --nodaemon --configuration $DIR/config/supervisord.conf") > /etc/init/budrest-supervisor.conf
#finally start countly api and dashboard
start budrest-supervisor