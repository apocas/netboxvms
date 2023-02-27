const Netbox = require('./netbox');
const ipaddrJs = require('ipaddr.js');

class Exporter {
  constructor(cluster, config) {
    this.netbox = new Netbox({
      baseURL: process.env.NETBOX_HOSTNAME || config.hostname,
      headers: {
        'Authorization': 'Token ' + process.env.NETBOX_TOKEN || config.token
      }
    }, cluster);
  }

  async getVMs() { }

  async addUpdateVMs(devices) {
    const realDevicesNames = devices.map(d => d.virtual_machine_id);
    const existingDevices = await this.netbox.getVMs();
    const existingDeviceNames = existingDevices.results.map(d => d.name);
    const existingDevicesIDs = existingDevices.results.map(d => d.id);

    for (let device of devices) {
      await this.netbox.addVM(device, existingDeviceNames.includes(device.virtual_machine_id) ? existingDevicesIDs[existingDeviceNames.indexOf(device.virtual_machine_id)] : null);

      try {
        await this.netbox.addInterface('frontend', device.virtual_machine_id);
      } catch (error) { }

      await this.addUpdateIPs(device);
    }

    for (let vm of existingDeviceNames) {
      if (!realDevicesNames.includes(vm)) {
        await this.netbox.deleteVM(existingDevicesIDs[existingDeviceNames.indexOf(vm)]);
        console.log(`VM ${vm} deleted.`);
      }
    }
  }

  async addUpdateIPs(vm) {
    var addresses = vm.ip_addresses;

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];

      if (ipaddrJs.parse(address).range() == 'unicast') {
        await this.netbox.addAddress(address, vm.virtual_machine_id, 'frontend');
      }
    }
  }

  async start() {
    const vmData = await this.getVMs();
    console.log(`Syncing ${vmData.length} VMs...`);
    await this.addUpdateVMs(vmData);
    console.log('Sync complete!');
  }
}

module.exports = Exporter;