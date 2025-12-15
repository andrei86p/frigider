class Scanner {
  constructor(elementId, onScan) {
    this.elementId = elementId;
    this.onScan = onScan;
    this.html5QrcodeScanner = null;
    this.isScanning = false;
  }

  start() {
    if (this.isScanning) return;
    this.isScanning = true;
    
    // Check if library is loaded
    if (!window.Html5Qrcode) {
        console.error("Html5Qrcode not loaded");
        // Mock for dev if no internet
        // setTimeout(() => this.onScan("123456789"), 1000);
        // return;
        alert("Scanner library missing. Please check your internet connection.");
        this.isScanning = false;
        return;
    }

    this.html5QrcodeScanner = new Html5Qrcode(this.elementId);
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    this.html5QrcodeScanner.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        // Success
        this.stop();
        this.isScanning = false;
        this.onScan(decodedText);
      },
      (errorMessage) => {
        // ignore errors
      }
    ).catch(err => {
      console.error(err);
      alert("Camera error: " + err);
      this.isScanning = false;
    });
  }

  stop() {
    if (this.html5QrcodeScanner && this.isScanning) {
      this.html5QrcodeScanner.stop().then(() => {
        this.html5QrcodeScanner.clear();
        this.isScanning = false;
      }).catch(err => console.error(err));
    }
  }
}

window.Scanner = Scanner;
