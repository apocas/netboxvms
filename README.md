# netboxvms

Export and sync VM metadata from multiple platforms to Netbox.

## Supported Platforms
* Onapp
* Proxmox
* VMmanager 6

### Adding a new platform
1. Create a new file in the `netboxvms/exporters` directory
2. Create a new class that inherits from `Exporter`
3. Implement the `getVMs` method. This method must return a list of `VM` objects. (check example.js)
4. Netboxvms will automatically detect the new exporter and use it, no need to change anything else. It will automatically detect what needs to be added, updated or deleted.

### Example
```js
var Exporter = require('./exporter');

class Example extends Exporter {
  constructor(cluster) {
    super(cluster);
    this.name = 'Example';

    this.tag = process.env.EXAMPLE_TAG || 'example-'

    //init...
  }

  //return a list of VMs, example VM object
  async getVMs() {
    var output = [
      {
        name: 'xpto',
        display_name: 'xpto.example.com',
        virtual_machine_id: this.tag + '123456',
        vcpus: 2,
        memory: 2048,
        disk: 10,
        ip_addresses: ['127.0.0.1'],
        status: 'online'
      },
      //...
    ];

    return output;
  }
}

module.exports = Example;
```

## Usage
* npm install
* NETBOX_HOSTNAME=xxx NETBOX_TOKEN=xxx ONAPP_CLUSTER=1 ONAPP_TAG=onapp- ONAPP_HOSTNAME=xxx ONAPP_USERNAME=xxx ONAPP_PASSWORD=xxx node main.js onapp

### Env vars
* `NETBOX_HOSTNAME` - Netbox URL
* `NETBOX_TOKEN` - Netbox API Token
* `[ONAPP,VMM6,PROXMOX,...]_CLUSTER` - Destination Netbox cluster ID
* `[ONAPP,VMM6,PROXMOX,...]_TAG` - Tag to be appended to VM name
* `[ONAPP,VMM6,PROXMOX,...]_HOSTNAME` - Platform hostname
* `[ONAPP,VMM6,PROXMOX,...]_USERNAME` - Platform username
* `[ONAPP,VMM6,PROXMOX,...]_PASSWORD` - Platform password/token/secret

