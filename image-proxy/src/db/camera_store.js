const { Client } = require('pg')

class CameraStore {
  constructor() {
    this.client = new Client({
      user: 'postgres',
      database: 'postgres',
      port: 5432,
    });
    this._init();
  }

  async _init() {
    await this.client.connect()
  }

  async insert(camera, spot) {
    const text = 'INSERT INTO cameras(camera_id, stream_url, still_url, rewind_clip, spot_id, spot_name) VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT (camera_id) DO UPDATE SET rewind_clip =$4';
    const values = [camera.id, camera.streamUrl, camera.stillUrl, camera.rewindClip, spot.id, spot.name];
    await this.client.query(text, values);
  }

  async find(spotName) {
    const text = 'select * from cameras where spot_name=$1';
    const values = [spotName];
    let res = await this.client.query(text, values);
    return res.rows[0];
  }
}

module.exports = new CameraStore();
