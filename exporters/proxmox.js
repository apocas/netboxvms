var Exporter = require('../lib/exporter');
const axiosm = require('axios');
const https = require('https');

//https://pve.proxmox.com/pve-docs/api-viewer/
class Proxmox extends Exporter {
  constructor(conf) {
    super(process.env.PROXMOX_CLUSTER || conf.cluster);

    this.name = 'Proxmox';

    this.tag = process.env.PROXMOX_TAG || 'proxmox-'

    this.axios = axiosm.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    this.config = {
      'baseURL': process.env.PROXMOX_HOSTNAME || conf.hostname,
      'headers': {
        'Authorization': 'PVEAPIToken=' + encodeURIComponent(process.env.PROXMOX_USERNAME + '=' + process.env.PROXMOX_PASSWORD)
      }
    }

  }

  async getVMs() {
    const response = await this.axios.get('/api2/json/cluster/resources?type=vm', this.config);

    var output = [];

    if (response.data && Array.isArray(response.data.data)) {
      for (let i = 0; i < response.data.data.length; i++) {
        var vm = response.data.data[i];

        var vm_output = {
          name: vm.name,
          display_name: vm.name,
          virtual_machine_id: this.tag + vm.vmid,
          vcpus: vm.maxcpu,
          memory: vm.maxmem / 1024 / 1024,
          disk: parseInt(vm.maxdisk / 1024 / 1024 / 1024),
          ip_addresses: [],
          status: 'offline'
        };

        if (vm.status == 'running') {
          vm_output.status = 'active';
        } else {
          vm_output.status = 'offline';
        }

        output.push(vm_output);
      }
    }

    return output;
  }
}

module.exports = Proxmox;