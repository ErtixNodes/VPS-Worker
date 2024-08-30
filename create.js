const sleep = ms => new Promise(r => setTimeout(r, ms));
const shell = require('shelljs');
const lib = require('./lib');

module.exports = async (job) => {
    var data = job.data;
    var id = job.id;

    console.log(`Creating ${id} with ${data.password} @ ${data.ip} -p ${data.sshPort}`, data);

    await job.updateProgress('Hello');

    var proxID = await shell.exec(`pvesh get /cluster/nextid`);
    // console.log('p', proxID, proxID.stdout);
    if (proxID.code != 0) throw new Error(`${proxID.stderr}`);

    proxID = String(proxID.stdout).replace('\n', '');
    proxID = parseInt(proxID);

    await job.updateProgress(`Got proxmox ID: ${proxID}`);

    var vpsCreateRes = await shell.exec(getCreateCMD(proxID, data.ip, data.password, '/var/lib/vz/template/cache/alpine-3.19-default_20240207_amd64.tar.xz', data.storage, data));

    // console.log(vpsCreateRes);

    if (vpsCreateRes.stderr.length > 0) throw new Error(`Error: ${vpsCreateRes.stderr}`);

    // console.log((await shell.exec('pct start ' + proxID)).stderr);

    await job.updateProgress('Empty vps created');

    console.log((await shell.exec(`cp /etc/pve/firewall/100.fw /etc/pve/firewall/${proxID}.fw`)).stderr);

    await job.updateProgress('Added firewall rules.');

    await shell.exec(`pct exec ${proxID} sh -- -c "echo 'https://dl-cdn.alpinelinux.org/alpine/v3.19/main' > /etc/apk/repositories"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "echo 'https://dl-cdn.alpinelinux.org/alpine/v3.19/community' >> /etc/apk/repositories"`);
    await job.updateProgress('Added custom mirror');

    await shell.exec(`pct exec ${proxID} sh -- -c "apk update"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "apk add wget"`);
    await job.updateProgress('Download wget');

    await shell.exec(`pct exec ${proxID} sh -- -c "apk update"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "apk add openssh zsh git wget curl htop sudo bash htop neofetch"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config"`);
    // sed -i 's#/bin/ash#/bin/zsh#' /etc/passwd
     await shell.exec(`pct exec ${proxID} sh -- -c "rc-update add sshd"`);
    await job.updateProgress('Allow ssh');

    await shell.exec(`pct exec ${proxID} sh -- -c "echo '\tFree VPS by ErtixNodes.' > /etc/motd"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "echo '\t' >> /etc/motd"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "echo '\tPackage manager: apk' >> /etc/motd"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "echo '\tYour vps ID: ${data.shortID}' >> /etc/motd"`);

    await job.updateProgress('Motd');

    await shell.exec(`pct exec ${proxID} sh -- -c "bash <(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`);
    await job.updateProgress('Oh my zsh');

    await shell.exec(`pct exec ${proxID} sh -- -c "sed -i 's#/bin/ash#/bin/zsh#' /etc/passwd"`);
    
    await shell.exec(`pct exec ${proxID} sh -- -c "wget https://raw.githubusercontent.com/ErtixNodes/Scripts/main/apt -O /bin/apt"`);
    await shell.exec(`pct exec ${proxID} sh -- -c "chmod 777 /bin/apt"`);

    await job.updateProgress('Add apt');

    await lib.addForward(data.portID, 22, data.sshPort, data.ip);

    await job.updateProgress('Port forwarded!');

    await shell.exec('pct reboot ' + proxID);

    await job.updateProgress('VPS restarted!');

        // Add custom ertixnodes repo :D
    await shell.exec(`pct exec ${proxID} sh -- -c "wget https://raw.githubusercontent.com/ErtixNodes/pkg/feat-ci/setup.sh -O /pkg.sh"`);
    await shell.exec(`pct exec ${proxID} zsh -- /pkg.sh`);
    await job.updateProgress('Added command logger');

    data.proxID = proxID;
    data.ok = true;

    return data;
};

function getCreateCMD(id, ip, password, path, storage, data) {
    // pct create $ID /var/lib/vz/template/cache/debian-12-standard_12.2-1_amd64.tar.zst --hostname=vps$ID --swap=4096 --memory=1024 --cmode=shell
    // --net0 name=eth0,bridge=vmbr0,firewall=1,gw=10.5.0.1,ip=$IP/16,rate=3 --ostype=debian --password $PASSWORD --start=1 --unprivileged=1 --cores=1
    // --features fuse=1,nesting=1,keyctl=1

    var cmd = '';
    cmd += 'pct create ';
    cmd += id;

    cmd += ` ${path} `
    cmd += `--swap=256 `;
    cmd += `--hostname=alpine${id}-${data.shortID} `;
    cmd += `--memory=1024 `;
    cmd += `--cmode=shell `;
    cmd += `--net0 name=eth0,bridge=vmbr0,firewall=1,gw=${data.subnet},ip=${ip}/16,rate=3 `;
    cmd += `--ostype=alpine `;
    cmd += `--password ${password} `;
    cmd += `--start=1 `;
    cmd += `--unprivileged=1 `;
    cmd += `--cores=1 `;
    cmd += `--features fuse=1,nesting=1,keyctl=1 `;
    cmd += `--rootfs ${storage}:3`;

    return cmd;
}
