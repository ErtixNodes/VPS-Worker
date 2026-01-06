const shell = require('shelljs');
const fs = require('fs');

if (!fs.existsSync('/port')) {
    fs.mkdirSync('/port');
}

async function addForward(ID, int, ext, ip) {
    console.log(`Adding ${ID} - :${ext} -> ${ip}:${int}`);
    // echo "iptables -t nat -A PREROUTING -p TCP --dport 3$(echo $ID)0 -j DNAT --to-destination $(echo $IP):22" >> $PN
    fs.writeFileSync(`/port/${ID}.sh`, `iptables -t nat -A PREROUTING -p TCP --dport ${ext} -j DNAT --to-destination ${ip}:${int}`);

    var a = await shell.exec(`bash /port/${ID}.sh`);
    // console.log('a', a);
    return a;
}

async function removeForward(ID, int, ext, ip) {
    console.log(`Removing ${ID} - :${ext} -> ${ip}:${int}`);
    // echo "iptables -t nat -A PREROUTING -p TCP --dport 3$(echo $ID)0 -j DNAT --to-destination $(echo $IP):22" >> $PN
    // fs.writeFileSync(`/port/${ID}.sh`, `iptables -t nat -A PREROUTING -p TCP --dport ${ext} -j DNAT --to-destination ${ip}:${int}`);

    fs.unlinkSync(`/port/${ID}.sh`);
    var a = await shell.exec(`iptables -t nat -D PREROUTING -p TCP --dport ${ext} -j DNAT --to-destination ${ip}:${int}`);
    // console.log('a', a);
    return a;
}

module.exports = {
    addForward,
    removeForward
}