
const brs = require('brs-js');
const fs = require('fs');
const path = require('path');

const fontParser = require('./util.fontParser.js');
const { moveBricks, ParseTool, WriteTool } = require('./util.tool.js');


const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);


const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function storeCoordinate(xVal, yVal, zVal, array) {
    array.push({x: xVal, y: yVal, z: zVal});
}
const doortypes = [];
const doornames = [];
let doorindex = 0;

const doorObjects = [];

const players = []
const playerPositions = [];

let doorrange = 50;

function Door(position, doorname, type){
    this.position = position;
    this.doorname = doorname;
    this.type = type;
    this.isopen=false;
    this.isvalid=true;
    this.holder = undefined;
    this.buildAuthor =  '039b96e9-1646-4b7d-9434-4c726218c6fa';
}
function Door(position, doorname, type, uuid){
    this.position = position;
    this.doorname = doorname;
    this.type = type;
    this.isopen=false;
    this.isvalid=true;
    this.holder = undefined;
    this.buildAuthor = '039b96e9-1646-4b7d-9434-4c726218c6fa';
}

function getPlayerID(username){
  for(let i = 0 ; i < players.length; i++){
    let d = players[i];
    if(d){
      if(d==username){
        return i;
      }
    }
  }
  return undefined;
}

function getDoor(doorname){
  for(let i = 0 ; i < doorObjects.length; i++){
    let d = doorObjects[i];
    if(d){
      if(d.doorname === doorname){
        return d;
      }
    }
  }
  return undefined;
}
function removeDoor(doorname){
  for(let i = 0 ; i < doorObjects.length; i++){
    let d = doorObjects[i];
    if(d){
      if(d.doorname == doorname){
        doorObjects[i] = undefined;
        d.isvalid=false;
      }
    }
  }
}

const doors = Object.fromEntries(fs.readdirSync(__dirname + '/doors')
  .map(f => f.match(/door_([a-z0-9_]+)\.brs/))
  .filter(f => f)
  .map(match => {
    try {
      doortypes[doorindex] = match[1];
      doorindex++;
      return [match[1], __dirname + '/doors/' + match[0]];
    } catch (err) {
      console.error('Error parsing door', match[1], ':', err);
    }
  })
  .filter(v => v));


class SimpleDoors {
  // the constructor also contains an omegga if you don't want to use the global one
  // config and store variables are optional but provide access to the plugin data store
  constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  async clearDoor(door){
    //Omegga.clearBricks('SimpleDoor-'+doorname,{quiet: false})
    Omegga.clearBricks('039b96e9-1646-4b7d-9434-4c726218c6fa',true);
  }

async openDoor(playername, door){
  door.isopen=true;
  this.clearDoor(door);
}
async closeDoor(door){
    door.isopen=false;
    const parser = new ParseTool(brs.read(fs.readFileSync(doors[door.type])));
    const tool = new WriteTool(parser.save).empty();
    tool.setAuthor({
      id: '039b96e9-1646-4b7d-9434-4c726218c6fa',
      name: 'SimpleDoor-'+door.doorname,
    });
    /*parser.save.bricks.forEach((item, i) => {
      item.author = {
        id: '039b96e9-1646-4b7d-9434-44726218c6fa',
        name: 'SimpleDoor-'+doorname,
      };
    });*/
      tool.addBrick(...moveBricks(parser.save.bricks, door.position));
    let save = tool.write();
    if (save.bricks.length === 0) return;
    // load the text save data as this owner
    Omegga.loadSaveData(save, {quiet: true});
}

async createdoor(type,doorname,position){
  doornames.push(doorname);
  doorObjects[doorObjects.length] = new Door(position,doorname,type);
  this.closeDoor(doorObjects[doorObjects.length-1]);
}

  async init() {
    let maxDoors = await this.store.get("doorcount")||0;
    for(let i = 0; i < maxDoors; i++){
      let doorname = await this.store.get("door."+i+".name");
        let doortype = await this.store.get("door."+i+".type");
          let doorpos = await this.store.get("door."+i+".position");
          let isvalid = await this.store.get("door."+i+".valid");
          let uuid = await this.store.get("door."+i+".auth");
          if(isvalid==true){
          this.createdoor(doortype,doorname,doorpos,uuid);
        }
    }


          let {
            'door-range': doorrange,
          } = this.config;

              Omegga
                .on('chatcmd:door', async (name, ...args) => {
                  Omegga.whisper(name,"<color=\"fab\">Door commands");
                    Omegga.whisper(name,"<color=\"bbb\">!Door:create (DoorType) (Name) <color=\"fff\">: Creates a door. Note that Name must be unique.");
                      Omegga.whisper(name,"<color=\"bbb\">!Door:list <color=\"fff\">:Lists all doors on the server");
                        Omegga.whisper(name,"<color=\"bbb\">!Door:delete (Name) <color=\"fff\">: Deletes a door. It will only disappear when another door is opened.");

                });
    Omegga
      .on('chatcmd:door:create', async (name, ...args) => {
        const player = Omegga.getPlayer(name);
          if (player){
        if(args[0] === undefined){
          Omegga.whisper(player,"<b>Available Doors Types("+doortypes.length+"):</>");
          for(let i = 0; i < doortypes.length; i++){
            Omegga.whisper(player,doortypes[i]);
          }
        }else{
          if(args[1] === undefined){
            Omegga.whisper(player,"To create a door, you must give your door a name.");
          }else {
                    let [x, y, z] = await player.getPosition();
                    x = (Math.floor((x+3)/5)*5);
                    y = (Math.floor((y+3)/5)*5);
                    z = (Math.floor((z-25)/4)*4);
                    let xyz = [x,y,z];

                    let found = false;
                    for(let i = 0; i < doortypes.length; i++){
                      if(args[0] == doortypes[i]){
                        found = true;
                      }
                    }
                    if(!found){
                      Omegga.whisper(player,"Could not create door with type "+args[0]);

                    }else{
                      if(getDoor(args[1])){
                        Omegga.whisper(player,"A door with the name "+args[1]+" already exists");

                      }else{
            this.createdoor(args[0],args[1],xyz);
              Omegga.whisper(player,"creating a \""+args[0]+"\" door with name "+args[1]);
            }
            }
		      }
        }
      }
      });

            Omegga
              .on('chatcmd:door:list', async (name, ...args) => {
                const player = Omegga.getPlayer(name);
                  if (player){
                  Omegga.whisper(player,"<b>Known Doors: ("+doorObjects.length+"):</>");
                  for(let i = 0; i < doorObjects.length; i++){
                    Omegga.whisper(player,doorObjects[i].doorname);
                  }
              }
              });

      Omegga
        .on('chatcmd:door:delete', async (name, ...args) => {
          const player = Omegga.getPlayer(name);
            if (player){
          if(args[0] === undefined){
            Omegga.whisper(player,"<b>Known Doors ("+doorObjects.length+"):</>");
            for(let i = 0; i < doorObjects.length; i++){
              Omegga.whisper(player,doorObjects[i].doorname);
            }
          }else{
                      let door = getDoor(args[0]);
                      if(door){
                        removeDoor(args[0]);
                          Omegga.whisper(player,"Door "+args[0]+" deleted. Open another door to clear the remains.");
                      }else{
                        Omegga.whisper(player,"Could not find door "+args[0]);
                      }
          }
        }
        });
    // determine of rules should be display on join
      Omegga.on('join', async player => {
            players[players.length] = player.name;
            this.logPlayerLoc(player);
      });

      this.handleDoors();
  }

async handleDoors(){

    try{
        await sleep(300);
        let clearedDoors = false;
        for(let doorindex = 0; doorindex < doorObjects.length;doorindex++){
          let door = doorObjects[doorindex];
          let foundPlayer = false;
          if(door){
          for(let playerindex = 0; playerindex < players.length;playerindex++){
            let player = players[playerindex];
            if(playerPositions[playerindex]){
            let distance = dist(playerPositions[playerindex],door.position);
            if(distance <= doorrange){
              foundPlayer=true;
                if(!door.isopen){
                  this.openDoor(player.name,door);
                  clearedDoors = true;
                }else{
                }
            }
          }
        }
          if(!foundPlayer){
            if(door.isopen){
                  this.closeDoor(door);
            }
          }
          }
        }
        if(clearedDoors){
        for(let doorindex = 0; doorindex < doorObjects.length;doorindex++){
          let door = doorObjects[doorindex];
          if(door){
            if(!door.isopen){
                this.closeDoor(door);
            }
          }
        }
        }

          this.handleDoors();
    }catch(e){
      Omegga.broadcast("error: "+e)
      this.handleDoors();
    }
}


  async logPlayerLoc(player){
    try{
        await sleep(500);
          let [x, y, z] = await Omegga.getPlayer(player.name).getPosition();
          x = Math.floor(x);
          y = Math.floor(y);
          z = Math.floor(z);
          let id = getPlayerID(player.name);
          playerPositions[id] = [x,y,z];
      this.logPlayerLoc(player);
    }catch(e){
      Omegga.whisper(player,"Error: "+e)
      this.logPlayerLoc(player);
    }
  }

  async stop() {
    for(let i = 0; i < doorObjects.length; i++){
      let door = doorObjects[i];
      if(door){
        this.store.set("door."+i+".name",door.doorname);
          this.store.set("door."+i+".type",door.type);
            this.store.set("door."+i+".valid",door.isvalid);
            this.store.set("door."+i+".position",door.position);
            this.store.set("door."+i+".auth",door.buildAuthor);
          }else{
              this.store.set("door."+i+".valid",false);
          }
    }
    this.store.set("doorcount",doorObjects.length);

  }
}

module.exports = SimpleDoors;
