class IPv4 {

  static parseOctets(ip) {
    return ip
      .split(".")
      .reduce((val, octet) => (val << 8) | parseInt(octet), 0);
  }

  static toBinary(n) {
    return [
      ((n >> 24) & 0xff).toString(2).padStart(8, "0"),
      ((n >> 16) & 0xff).toString(2).padStart(8, "0"),
      ((n >> 8) & 0xff).toString(2).padStart(8, "0"),
      ((n >> 0) & 0xff).toString(2).padStart(8, "0")
    ].join(".");
  }

  static toOctets(n) {
    return [
      ((n >> 24) & 0xff).toString(10),
      ((n >> 16) & 0xff).toString(10),
      ((n >> 8) & 0xff).toString(10),
      ((n >> 0) & 0xff).toString(10)
    ].join(".");
  }
}

class CIDR {
  constructor(cidr) {
    if(!cidr) {
      return;
    }

    let [ip, net] = cidr.split("/");

    this.ip = IPv4.parseOctets(ip);

    const classbits = this.ip >> 24;
    if (!(classbits & 0x80)) {
      this.class = "A"; // ip binary starts with 0
      net ||= 8
    } else if (classbits & 192) {
      this.class = "C"; // ip binary starts with 11
      net ||= 24
    } else if (classbits & 128) {
      this.class = "B"; // ip binary starts with 10
      net ||= 16
    }

    // check for rfc1918 address
    const netbits = this.ip >> 16;
    this.isRFC1918 = (
      (netbits & 0xFF00) == 0x0A00 || // 10.*.*.*
      (netbits & 0xFFF0) == 0xAC10 || // 172.16.*.*
      (netbits & 0xFFFF) == 0xC0A8    // 192.168.*.*
    );
    this.isLinkLocal = (netbits & 0xFFFF) == 0xA9FE // 169.254 link local address
    this.isLoopBack = (netbits & 0xFF00) == 0x7F00 // 169.254 link local address
    
    if(this.isRFC1918) this.type = 'Private';
    else if(this.isLinkLocal) this.type = 'Link Local';
    else if(this.isLoopBack) this.type = 'Loopback';
    else this.type = null;

    this.networkbits = parseInt(net);
    this.hostbits = 32 - this.networkbits
    this.wildcard = (1 << (this.hostbits)) - 1;
    this.subnetMask = 0xffffffff - this.wildcard;
    this.subnet = this.subnetMask & this.ip;
    this.broadcast = this.ip | this.wildcard;
    this.hosts = Math.max((2 ** this.hostbits) - Math.min(this.hostbits , 2), 1);
  }
}

Vue.component("ip", {
  props: ["title", "ip", "netmask"],
  filters: {
    toOctets: IPv4.toOctets,
    toBinary: IPv4.toBinary,

  },
  methods: {
    binary: function (val) {
      return IPv4.toBinary(val);
    },
    spanClass: function (bit, index) {
      // offset the bitidx to handle '.' in the ip format.
      const bitIdx = index - Math.floor(index / 9) + 1;
      return {
        b: bit !== ".",
        s: bit === ".",
        off: bit === "0",
        on: bit === "1",
        n: bitIdx <= this.netmask,
        h: bitIdx > this.netmask
      };
    }
  },
  template: `
  <div class="ip-card">
    <header>
      <h1 class="float-left">{{title}}</h1>
      <h1 class="float-right">{{ip | toOctets}}</h1>
    </header>
    <div class="binary">
      <span v-for="(bit, index) in binary(ip).split('')" v-bind:class="spanClass(bit, index)">{{bit}}</span>
    </div>
  </div>`
});


var app = new Vue({
  el: "#subnet-calculator",
  created: function () {
    let self = this;
    fetch("https://ipv4.ip.nf/me.json").then(function (res) {
      return res.json();
    }).then(function (data) {
      self.input = data.ip.ip + '/' + data.ip.netmask;
      self.cidr = new CIDR(self.input);
    });

    let params = window.location.hash.slice(1).split("&").reduce((params, hv) => {
      let p = hv.split("=");
      params[p[0]] = p[1];
      return params;
    }, {});

    if (params.cidr) {
      this.input = params.cidr;
      this.cidr = new CIDR(params.cidr);
    }
  },
  data: {
    input: "",
    cidr: new CIDR(),
    showBinary: false
  },
  methods: {
    onchange: function (input) {
      this.cidr = new CIDR(input);
    }
  }
});
