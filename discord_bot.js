try {
	var Discord = require("discord.js");
} catch (e){
	console.log(e.stack);
	console.log(process.version);
	console.log("Please run npm install and ensure it passes with no errors!");
	process.exit();
}

try {
	var yt = require("./youtube_plugin");
	var youtube_plugin = new yt();
} catch(e){
	console.log("couldn't load youtube plugin!\n"+e.stack);
}

/*try {
	var wa = require("./wolfram_plugin");
	var wolfram_plugin = new wa();
} catch(e){
	console.log("couldn't load wolfram plugin!\n"+e.stack);
}*/

// Get authentication data
try {
	var AuthDetails = require("./auth.json");
} catch (e){
	console.log("Please create an auth.json like auth.json.example with at least an email and password.\n"+e.stack);
	process.exit();
}

// Load custom permissions
var Permissions = {};
try{
	Permissions = require("./permissions.json");
} catch(e){}
Permissions.checkPermission = function (user,permission){
	try {
		var allowed = false;
		try{
			if(Permissions.global.hasOwnProperty(permission)){
				allowed = Permissions.global[permission] == true;
			}
		} catch(e){}
		try{
			if(Permissions.users[user.id].hasOwnProperty(permission)){
				allowed = Permissions.users[user.id][permission] == true;
			}
		} catch(e){}
		return allowed;
	} catch(e){}
	return false;
}

//load config data
var Config = {};
try{
	Config = require("./config.json");
} catch(e){ //no config file, use defaults
	Config.debug = false;
	Config.respondToInvalid = false;
}

var qs = require("querystring");

var d20 = require("d20");

var htmlToText = require('html-to-text');

var startTime = Date.now();

var giphy_config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/random",
    "permission": ["NORMAL"]
};


//https://api.imgflip.com/popular_meme_ids
var meme = {
	"brace": 61546,
	"mostinteresting": 61532,
	"fry": 61520,
	"onedoesnot": 61579,
	"yuno": 61527,
	"success": 61544,
	"allthethings": 61533,
	"doge": 8072285,
	"drevil": 40945639,
	"skeptical": 101711,
	"notime": 442575,
	"yodawg": 101716
};

var aliases;
var messagebox;

var playlists = {
	"playlist_axecident": {
        description: "plays kirito's playlist",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=NNpuKshL_SM");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=v8O2NKi-ZSo");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=WkLO8llyN64");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kguRNaAO8oc");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=RgKAFK5djSk");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=55gfjDAwdQM");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=w_RHpzpUz7g");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=c0mX-5q3mrY");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kXYiU_JCYtU");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=o_1aF54DO60");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=wXcdYBh3hgg");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=RisT-JpX_cs");
			console.log("playlist_axecident has been started by " + msg.author)
	    }
    },
	"playlist_nightmix": {
        description: "plays the playlist containing long mixes of nightstep/nightcore songs",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=Hg53gjcOwvo");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=pTLdUBfGzvw");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=SRKKJXHIw6A");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=ER_mANF7f2g");
			console.log("playlist_nightmix has been started by " + msg.author)
	    }
    },
	"playlist_drops": {
        description: "plays the playlist containing songs with drops in 'em",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=BrCKvKXvN2c");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=rEL-HdWvLpM");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=SDiJiGuUeBo");
			console.log("playlist_drops has been started by " + msg.author)
	    }
    },
	"playlist_jettsu": {
        description: "plays the playlist containing songs that are chill",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=sEQf5lcnj_o&nohtml5=False");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=HMGetv40FkI");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kpARMwBEpFk&list=PLCBMNXo_yZDAcX5BC-4ash_sg2L-PN7Rf&index=3");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=3kdv2X283KM");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=CWIKp2Lsj9w");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=7XmDYJBZZdc");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=u-blwjXkZow&nohtml5=False");
            console.log("playlist_jettsu has been started by " + msg.author)
        }
    },
}

var commands = {
	"gif": {
		usage: "<image tags>",
        description: "returns a random gif matching the tags passed",
		process: function(bot, msg, suffix) {
		    var tags = suffix.split(" ");
		    get_gif(tags, function(id) {
			if (typeof id !== "undefined") {
			    bot.sendMessage(msg.channel, "http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
			else {
			    bot.sendMessage(msg.channel, "Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
		    });
		}
	},
    "ping": {
        description: "responds pong, useful for checking if bot is alive",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.sender+" pong!");
            if(suffix){
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "servers": {
        description: "lists servers bot is connected to",
        process: function(bot,msg){bot.sendMessage(msg.channel,bot.servers);}
    },
    "channels": {
        description: "lists channels bot is connected to",
        process: function(bot,msg) { bot.sendMessage(msg.channel,bot.channels);}
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function(bot,msg){bot.sendMessage(msg.channel,msg.author.id);}
    },
    "idle": {
        description: "sets bot status to idle",
        process: function(bot,msg){ bot.setStatusIdle();}
    },
    "online": {
        description: "sets bot status to online",
        process: function(bot,msg){ bot.setStatusOnline();}
    },
    "y": {
        usage: "<video tags>",
        description: "gets youtube video matching tags",
        process: function(bot, msg, suffix) {
            youtube_plugin.respond(suffix, msg.channel, bot);
        }
    },
    "say": {
        usage: "<message>",
        description: "bot says message",
        process: function(bot,msg,suffix){ bot.sendMessage(msg.channel,suffix);}
    },
	"announce": {
        usage: "<message>",
        description: "bot says message with text to speech",
        process: function(bot,msg,suffix){ bot.sendMessage(msg.channel,suffix,{tts:true});}
    },
    /*"pullanddeploy": {
        description: "bot will perform a git pull master and restart with the new code",
        process: function(bot,msg,suffix) {
            bot.sendMessage(msg.channel,"fetching updates...",function(error,sentMsg){
                console.log("updating...");
	            var spawn = require('child_process').spawn;
                var log = function(err,stdout,stderr){
                    if(stdout){console.log(stdout);}
                    if(stderr){console.log(stderr);}
                };
                var fetch = spawn('git', ['fetch']);
                fetch.stdout.on('data',function(data){
                    console.log(data.toString());
                });
                fetch.on("close",function(code){
                    var reset = spawn('git', ['reset','--hard','origin/master']);
                    reset.stdout.on('data',function(data){
                        console.log(data.toString());
                    });
                    reset.on("close",function(code){
                        var npm = spawn('npm', ['install']);
                        npm.stdout.on('data',function(data){
                            console.log(data.toString());
                        });
                        npm.on("close",function(code){
                            console.log("goodbye");
                            bot.sendMessage(msg.channel,"brb!",function(){
                                bot.logout(function(){
                                    process.exit();
                                });
                            });
                        });
                    });
                });
            });
        }
    },
	*/
    "meme": {
        usage: 'meme "top text" "bottom text"',
        process: function(bot,msg,suffix) {
            var tags = msg.content.split('"');
            var memetype = tags[0].split(" ")[1];
            //bot.sendMessage(msg.channel,tags);
            var Imgflipper = require("imgflipper");
            var imgflipper = new Imgflipper(AuthDetails.imgflip_username, AuthDetails.imgflip_password);
            imgflipper.generateMeme(meme[memetype], tags[1]?tags[1]:"", tags[3]?tags[3]:"", function(err, image){
                //console.log(arguments);
                bot.sendMessage(msg.channel,image);
            });
        }
    },
    "memehelp": { //TODO: this should be handled by !help
        description: "returns available memes for !meme",
        process: function(bot,msg) {
            var str = "Currently available memes:\n"
            for (var m in meme){
                str += m + "\n"
            }
            bot.sendMessage(msg.channel,str);
        }
    },
    "version": {
        description: "returns the git commit this bot is running",
        process: function(bot,msg,suffix) {
            var commit = require('child_process').spawn('git', ['log','-n','1']);
            commit.stdout.on('data', function(data) {
                bot.sendMessage(msg.channel,data);
            });
            commit.on('close',function(code) {
                if( code != 0){
                    bot.sendMessage(msg.channel,"failed checking git version!");
                }
            });
        }
    },
    "log": {
        usage: "<log message>",
        description: "logs message to bot console",
        process: function(bot,msg,suffix){console.log(msg.content);}
    },
    "wiki": {
        usage: "<search terms>",
        description: "returns the summary of the first matching search result from Wikipedia",
        process: function(bot,msg,suffix) {
            var query = suffix;
            if(!query) {
                bot.sendMessage(msg.channel,"usage: !wiki search terms");
                return;
            }
            var Wiki = require('wikijs');
            new Wiki().search(query,1).then(function(data) {
                new Wiki().page(data.results[0]).then(function(page) {
                    page.summary().then(function(summary) {
                        var sumText = summary.toString().split('\n');
                        var continuation = function() {
                            var paragraph = sumText.shift();
                            if(paragraph){
                                bot.sendMessage(msg.channel,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.channel,err);
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
        process: function(bot,msg,suffix) {
            console.log(bot.joinServer(suffix,function(error,server) {
                console.log("callback: " + arguments);
                if(error){
                    bot.sendMessage(msg.channel,"failed to join: " + error);
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel,"Successfully joined " + server);
                }
            }));
        }
    },
    "create": {
        usage: "<channel name>",
        description: "creates a new text channel with the given name.",
        process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"text").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
    },
	"voice": {
		usage: "<channel name>",
		description: "creates a new voice channel with the give name.",
		process: function(bot,msg,suffix) {
            bot.createChannel(msg.channel.server,suffix,"voice").then(function(channel) {
                bot.sendMessage(msg.channel,"created " + channel.id);
				console.log("created " + channel);
            }).catch(function(error){
				bot.sendMessage(msg.channel,"failed to create channel: " + error);
			});
        }
	},
    "delete": {
        usage: "<channel name>",
        description: "deletes the specified channel",
        process: function(bot,msg,suffix) {
			var channel = bot.channels.get("id",suffix);
			if(suffix.startsWith('<#')){
				channel = bot.channels.get("id",suffix.substr(2,suffix.length-3));
			}
            if(!channel){
				var channels = bot.channels.getAll("name",suffix);
				if(channels.length > 1){https://github.com/chalda/DiscordBot/issues/new
					var response = "Multiple channels match, please use id:";
					for(var i=0;i<channels.length;i++){
						response += channels[i] + ": " + channels[i].id;
					}
					bot.sendMessage(msg.channel,response);
					return;
				}else if(channels.length == 1){
					channel = channels[0];
				} else {
					bot.sendMessage(msg.channel, "Couldn't find channel " + suffix + " to delete!");
					return;
				}
			}
            bot.sendMessage(msg.channel.server.defaultChannel, "deleting channel " + suffix + " at " +msg.author + "'s request");
            if(msg.channel.server.defaultChannel != msg.channel){
                bot.sendMessage(msg.channel,"deleting " + channel);
            }
            bot.deleteChannel(channel).then(function(channel){
				console.log("deleted " + suffix + " at " + msg.author + "'s request");
            }).catch(function(error){
				bot.sendMessage(msg.channel,"couldn't delete channel: " + error);
			});
        }
    },
    "stock": {
        usage: "<stock to fetch>",
        process: function(bot,msg,suffix) {
            var yahooFinance = require('yahoo-finance');
            yahooFinance.snapshot({
              symbol: suffix,
              fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
            }, function (error, snapshot) {
                if(error){
                    bot.sendMessage(msg.channel,"couldn't get stock: " + error);
                } else {
                    //bot.sendMessage(msg.channel,JSON.stringify(snapshot));
                    bot.sendMessage(msg.channel,snapshot.name
                        + "\nprice: $" + snapshot.lastTradePriceOnly);
                }  
            });
        }
    },
	/*"wolfram": {
		usage: "<search terms>",
        description: "gives results from wolframalpha using search terms",
        process: function(bot,msg,suffix){
				if(!suffix){
					bot.sendMessage(msg.channel,"Usage: !wolfram <search terms> (Ex. !wolfram integrate 4x)");
				}
	            wolfram_plugin.respond(suffix,msg.channel,bot);
       	    }
	},*/
    "rss": {
        description: "lists available rss feeds",
        process: function(bot,msg,suffix) {
            /*var args = suffix.split(" ");
            var count = args.shift();
            var url = args.join(" ");
            rssfeed(bot,msg,url,count,full);*/
            bot.sendMessage(msg.channel,"Available feeds:", function(){
                for(var c in rssFeeds){
                    bot.sendMessage(msg.channel,c + ": " + rssFeeds[c].url);
                }
            });
        }
    },
    "reddit": {
        usage: "[subreddit]",
        description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top psot there instead",
        process: function(bot,msg,suffix) {
            var path = "/.rss"
            if(suffix){
                path = "/r/"+suffix+path;
            }
            rssfeed(bot,msg,"https://www.reddit.com"+path,1,false);
        }
    },
	"alias": {
		usage: "<name> <actual command>",
		description: "Creates command aliases. Useful for making simple commands on the fly",
		process: function(bot,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				bot.sendMessage(msg.channel,"!alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				bot.sendMessage(msg.channel,"overwriting commands with aliases is not allowed!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				bot.sendMessage(msg.channel,"created alias " + name);
			}
		}
	},
	"userid": {
		usage: "[user to get id of]",
		description: "Returns the unique id of a user. This is useful for permissions.",
		process: function(bot,msg,suffix) {
			if(suffix){
				var users = msg.channel.server.members.getAll("username",suffix);
				if(users.length == 1){
					bot.sendMessage(msg.channel, "The id of " + users[0] + " is " + users[0].id)
				} else if(users.length > 1){
					var response = "multiple users found:";
					for(var i=0;i<users.length;i++){
						var user = users[i];
						response += "\nThe id of " + user + " is " + user.id;
					}
					bot.sendMessage(msg.channel,response);
				} else {
					bot.sendMessage(msg.channel,"No user " + suffix + " found!");
				}
			} else {
				bot.sendMessage(msg.channel, "The id of " + msg.author + " is " + msg.author.id);
			}
		}
	},
	"eval": {
		usage: "<command>",
		description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
		process: function(bot,msg,suffix) {
			if(Permissions.checkPermission(msg.author,"eval")){
				bot.sendMessage(msg.channel, eval(suffix,bot));
			} else {
				bot.sendMessage(msg.channel, msg.author + " doesn't have permission to execute eval!");
			}
		}
	},
	"topic": {
		usage: "[topic]",
		description: 'Sets the topic for the channel. No topic removes the topic.',
		process: function(bot,msg,suffix) {
			bot.setChannelTopic(msg.channel,suffix);
		}
	},
	"roll": {
        usage: "[# of sides] or [# of dice]d[# of sides]( + [# of dice]d[# of sides] + ...)",
        description: "roll one die with x sides, or multiple dice using d20 syntax. Default value is 10",
        process: function(bot,msg,suffix) {
            if (suffix.split("d").length <= 1) {
                bot.sendMessage(msg.channel,msg.author + " rolled a " + d20.roll(suffix || "10"));
            }  
            else if (suffix.split("d").length > 1) {
                var eachDie = suffix.split("+");
                var passing = 0;
                for (var i = 0; i < eachDie.length; i++){
                    if (eachDie[i].split("d")[0] < 50) {
                        passing += 1;
                    };
                }
                if (passing == eachDie.length) {
                    bot.sendMessage(msg.channel,msg.author + " rolled a " + d20.roll(suffix));
                }  else {
                    bot.sendMessage(msg.channel,msg.author + " tried to roll too many dice at once!");
                }
            }
        }
    },
	/*"msg": {
		usage: "<user> <message to leave user>",
		description: "leaves a message for a user the next time they come online",
		process: function(bot,msg,suffix) {
			var args = suffix.split(' ');
			var user = args.shift();
			var message = args.join(' ');
			if(user.startsWith('<@')){
				user = user.substr(2,user.length-3);
			}
			var target = msg.channel.server.members.get("id",user);
			if(!target){
				target = msg.channel.server.members.get("username",user);
			}
			messagebox[target.id] = {
				channel: msg.channel.id,
				content: target + ", " + msg.author + " said: " + message
			};
			updateMessagebox();
			bot.sendMessage(msg.channel,"message saved.")
		}
	},*/
	"twitch": {
		usage: "<stream>",
		description: "checks if the given stream is online",
		process: function(bot,msg,suffix){
			require("request")("https://api.twitch.tv/kraken/streams/"+suffix,
			function(err,res,body){
				var stream = JSON.parse(body);
				if(stream.stream){
					bot.sendMessage(msg.channel, suffix
						+" is online, playing "
						+stream.stream.game
						+"\n"+stream.stream.channel.status
						+"\n"+stream.stream.preview.large)
						bot.sendMessage(msg.channel, "<https://www.twitch.tv/"+suffix+">");
				}else{
					bot.sendMessage(msg.channel, suffix+" is offline")
				}
			});
		}
	},
	"xkcd": {
		usage: "[comic number]",
		description: "displays a given xkcd comic number (or the latest if nothing specified",
		process: function(bot,msg,suffix){
			var url = "http://xkcd.com/";
			if(suffix != "") url += suffix+"/";
			url += "info.0.json";
			require("request")(url,function(err,res,body){
				try{
					var comic = JSON.parse(body);
					bot.sendMessage(msg.channel,
						comic.title+"\n"+comic.img,function(){
							bot.sendMessage(msg.channel,comic.alt)
					});
				}catch(e){
					bot.sendMessage(msg.channel,
						"Couldn't fetch an XKCD for "+suffix);
				}
			});
		}
	},
    "watchtogether": {
        usage: "[video url (Youtube, Vimeo)",
        description: "Generate a watch2gether room with your video to watch with your little friends!",
        process: function(bot,msg,suffix){
            var watch2getherUrl = "https://www.watch2gether.com/go#";
            bot.sendMessage(msg.channel,
                "watch2gether link",function(){
                    bot.sendMessage(msg.channel,watch2getherUrl + suffix)
                })
        }
    },
    "uptime": {
    	usage: "",
	description: "returns the amount of time since the bot started",
	process: function(bot,msg,suffix){
		var now = Date.now();
		var msec = now - startTime;
		console.log("Uptime is " + msec + " milliseconds");
		var days = Math.floor(msec / 1000 / 60 / 60 / 24);
		msec -= days * 1000 * 60 * 60 * 24;
		var hours = Math.floor(msec / 1000 / 60 / 60);
		msec -= hours * 1000 * 60 * 60;
		var mins = Math.floor(msec / 1000 / 60);
		msec -= mins * 1000 * 60;
		var secs = Math.floor(msec / 1000);
		var timestr = "";
		if(days > 1) {
			timestr += days + " days ";
		}
		if(days == 1) {
			timestr += days + " day ";
		}
		if(hours > 1) {
			timestr += hours + " hours ";
		}
		if(hours == 1) {
			timestr += hours + " hour ";
		}
		if(mins > 1) {
			timestr += mins + " minutes ";
		}
		if(mins == 1) {
			timestr += mins + " minute ";
		}
		if(secs > 1) {
			timestr += secs + " seconds ";
		}
		if(secs == 1) {
			timestr += secs + " second ";
		}
		bot.sendMessage(msg.channel,"Uptime: " + timestr);
	}
    },
	"night": {
        description: 'Gives you a goodnight message :).',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Good night s-senpai " + msg.author + " >///<");
        }
    },
    "gnight": {
        description: 'Gives you a different goodnight message :).',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Good night, have lots of sweet dreams " + msg.author + "! >///<")

        }
    },
	"awake": {
        description: 'Gives you a wake up welcome message.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.author + " Hey sleepyhead it's good to see you're finally awake!")

        }
    },
    "bye": {
        description: 'Gives you a farewell message :).',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "See you later " + msg.author + "! " + "（＾○＾）／");
        }
    },
    "afk": {
        description: 'Lets the channel know you are afk!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "senpai " + msg.author + " is now afk! >.>");
        }
    },
    "back": {
        description: 'Lets the channel know you are back!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Senpai " + msg.author + " is back," + " welcome back " + msg.author + "!");
        }
    },
    "hello": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Hello! >///< " + msg.author);
        }
    },
    "hi": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Hi! >///< " + msg.author);
        }
    },
    "sexmeplz": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, " I'm afraid I can't do that " + msg.author + ".");
        }
    },
    "strings": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, " There are no strings on me.");
        }
    },
    "osu": {
        description: 'Fetches a link to osu!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "https://osu.ppy.sh/");
			bot.delete.message(msg.channel, message);
        }
    },
	"youtube": {
        description: 'Fetches a link to youtube!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "https://www.youtube.com/");
        }
    },
    "intro": {
        description: 'Aika introduces herself!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Hello, my name is Aika, I am here to help you with anything you need!（＾○＾）／");
        }
    },
	"welcome": {
        description: 'Welcomes a new comer',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Hey there new person! Welcome to our humble abode!（＾○＾）／");
        }
    },
	"lf": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "( ͡° ͜ʖ ͡°)");
        }
    },
	"kirito": {
        description: 'Description of Kirito.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Kirito is the person who helps me grow! he is very nice to me, and is adding code to me whenever he thinks it necessary! Kirito's real name is Alex and he lives in Australia >///< feel free to ask him any questions, I'm sure he won't mind!");
        }
    },
	"asuna": {
        description: 'Description of Asuna.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Lovable, Huggable and Beautiful. Also very off limits. :)");
        }
    },
	"ffff": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "http://www.ragefacecomics.com/faces/large/rage-classic-l.png");
        }
    },
	"chinchin": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "http://static2.fjcdn.com/thumbnails/comments/Ey+b0ss+it+looks+like+you+habe+some+cancer+b0ss+_122495022efb6e0e4c5952d4e0bbd5da.jpg");
        }
    },
	"ricefields": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "http://38.media.tumblr.com/7f1e9981470cc84ca23bbf370684a356/tumblr_no9oq9EntS1tis60co1_500.gif");
        }
    },
	"grats": {
        description: 'congratulates someone?',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Congratulations, you've done well! want a cookie? ^-^");
        }
    },
	"ty": {
        description: 'Says a response to "thank you"',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "You're very welcome " + msg.author + "!");
        }
    },
	"floofy": {
        description: 'Description of Floofy.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Floofy is that gmod nerd! hes a pretty chill guy, and loves to make new friends! FLooFY can be referred to as FLooF and lives in Australia ( ͡° ͜ʖ ͡°) feel free to ask him anything, he would be more then happy to help.");
        }
    },
	"ily": {
        description: '...',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.author + " I'm afraid I wasn't programmed to love...");
        }
    },
	"fgt": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.author + " User fgt not found! please try looking in the mirror, you should find what you're looking for there!");
        }
    },
	"animus": {
        description: 'Gives you an invite link so you can invite your friends also links you the official Animus website!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "Here is the invite link: https://discord.gg/0abEJoLeXf9kswil");
			bot.sendMessage(msg.author, "Here is the Animus website: http://animus.site88.net/");
        }
    },
	"hug": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "(づ｡◕‿‿◕｡)づ");
        }
    },
	"100101001": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "http://hackertyper.net/");
        }
    },
	"memeids": {
        description: 'Gives you a link to the list of meme IDs',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "https://api.imgflip.com/popular_meme_ids");
        }
    },
	"tm": {
        description: 'Does Stuff™',
        process: function(bot, msg, suffix) {
			var args = suffix.split('');
			var user = args.shift();
			var message = args.join('');
            bot.sendMessage(msg.channel, message + "™");
        }
    },
	"spoiler": {
        description: 'Creates a spoiler warning',
        process: function(bot, msg, suffix) {
			var args = suffix.split('');
			var user = args.shift();
			var message = args.join('');
            bot.sendMessage(msg.channel, "The following message(s) is a potential spoiler of " + message + " Please do not read it if you have not finished watching/are not up-to-date with " + message);
        }
    },
	"boxify": {
        description: 'Boxifies a message.',
        process: function(bot, msg, suffix) {
			var args = suffix.split('');
			var user = args.shift();
			var message = args.join('');
            bot.sendMessage(msg.channel, "```" + message + "```");
        }
    },
	"speedtest": {
        description: 'gives a link to http://www.speedtest.net/',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "http://www.speedtest.net/");
        }
    },
	"myip": {
        description: 'Gives you a link that shows you your IP',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "Your ip address is here: http://www.ipchicken.com/");
        }
    },
	"proxy": {
        description: 'Gives you 3 links to proxy websites',
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.author, "Proxy 1 https://www.kproxy.com/");
			sleep(1000);
			bot.sendMessage(msg.author, "Proxy 2 https://www.proxysite.com/");
			sleep(1000);
			bot.sendMessage(msg.author, "Proxy 3 https://hide.me/en/proxy");
	    }
    },
	"exeraph": {
        description: 'Description of Exeraph.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Exeraph is a friend of Kirito's, his real name is Tynan. He lives in Australia, he's usually quite punny, and I'm sure he would be happy to help out if you need something! >.>");
        }
    },
	"jettsu": {
        description: 'Description of Jettsu.',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Jettsu is that guy, yep that's all there is to it >.> feel free to ask him anything, he would be more then happy to" + '"help" >///<.');
        }
    },
	"tctd": {
		description: 'Tells you what TCTD stands for',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "TCTD Stands for Tom Clancy's The Division, It is a game. Here is the game's website http://tomclancy-thedivision.ubi.com/game/en-au/home/");
        }
    },
	"playlist_animcore": {
        description: "plays animcore's playlist",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=NNpuKshL_SM");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=v8O2NKi-ZSo");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=WkLO8llyN64");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kguRNaAO8oc");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=RgKAFK5djSk");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=55gfjDAwdQM");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=w_RHpzpUz7g");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=c0mX-5q3mrY");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kXYiU_JCYtU");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=o_1aF54DO60");
			bot.sendMessage(msg.channel, "~n http://www.youtube.com/watch?v=wXcdYBh3hgg");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=RisT-JpX_cs");
			console.log("playlist_animcore has been started by " + msg.author)
	    }
    },
	"playlist_nightmix": {
        description: "plays the playlist containing long mixes of nightstep/nightcore songs",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=Hg53gjcOwvo");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=pTLdUBfGzvw");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=SRKKJXHIw6A");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=ER_mANF7f2g");
			console.log("playlist_nightmix has been started by " + msg.author)
	    }
    },
	"playlist_drops": {
        description: "plays the playlist containing songs with drops in 'em",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=BrCKvKXvN2c");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=rEL-HdWvLpM");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=SDiJiGuUeBo");
			console.log("playlist_drops has been started by " + msg.author)
	    }
    },
    	"playlist_test": {
        description: "plays the test playlist containing songs for the sake of testing",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=BrCKvKXvN2c");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=rEL-HdWvLpM");
			bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=SDiJiGuUeBo");
			console.log("playlist_test has been started by " + msg.author)
	    }
    },
	"playlist_jettsu": {
        description: "plays the playlist containing songs that are chill",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=sEQf5lcnj_o&nohtml5=False");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=HMGetv40FkI");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=kpARMwBEpFk&list=PLCBMNXo_yZDAcX5BC-4ash_sg2L-PN7Rf&index=3");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=3kdv2X283KM");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=CWIKp2Lsj9w");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=7XmDYJBZZdc");
            bot.sendMessage(msg.channel, "~n https://www.youtube.com/watch?v=u-blwjXkZow&nohtml5=False");
            console.log("playlist_jettsu has been started by " + msg.author)
        }
	},
	"playlist_list": {
        description: "list of all playlist commands",
        process: function(bot, msg, suffix) {
			var cmd = playlists[cmdTxt];
			if(cmdTxt === "playlist_list"){
				bot.sendMessage(msg.author, "All playlist commands:", function(){
					for(var cmd in playlists) {
						var info = "!" + cmd;
						bot.sendMessage(msg.author, "``` " + info + " ```");
					}
				});
			}
	    }
    },
	"playlist_help": {
        description: "gives you some info about using playlists",
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.author, "To use playlists for Aika Music, Aika must be online. (me), If I am online then you can type the command to use a playlist, for example '!playlist_drops' without the ' '. What the playlist command does is it queues up a bunch of songs in a pre-made playlist. If you would like to make your own playlist please contact one of the admins.");
	    }
    },
	"requestmeme": {
        usage: "<command> <name of meme> <meme id>",
        description: 'Adds a meme to the list of memes',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var message = args.join(' ');

			bot.users.get('id', '105640584470937600')
			
			bot.sendMessage(bot.users.get('id', '105640584470937600'), msg.author + " requested this meme: " + message)
		}
		
    },
	"requestmemehelp": {
        description: 'Tells you how to use !requestmeme',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "An example of how you use !requestmeme would be !requestmeme @Kirito example 5316361 ");
			sleep(1000);
			bot.sendMessage(msg.author, "Please keep in mind that if the meme you requested doesn't get added within 2 days a meme with the same id probably already exists!");
			sleep(1000);
			bot.sendMessage(msg.author, "To get meme IDs please type !memeids");
        }
    },
	"requestcommand": {
        usage: "<command> <name of command> <explanation/description of what the command will do>",
        description: 'Requests a command',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
			var message = args.join(' ');
			
			bot.users.get('id', '105640584470937600')
			
			bot.sendMessage(bot.users.get('id', '105640584470937600'), msg.author + " requested this command: " + message)
		}
		
    },
	"requestcommandhelp": {
        usage: "<command> <name of command> <explanation/description of what the command will do>",
        description: 'Requests a command',
		process: function(bot, msg, suffix) {
			
			bot.sendMessage(msg.author, "An example of how request a command is like this.");
			sleep(2000);
			bot.sendMessage(msg.author, "!requestcommand !kappa sends a kappa face in chat");
			sleep(2000);
			bot.sendMessage(msg.author, "Make sure there are no spaces in the command for example you can NOT do this:");
			sleep(2000);
			bot.sendMessage(msg.author, "!requestcommand !kappa face sends a kappa face in chat");
			sleep(2000);
			bot.sendMessage(msg.author, "You can however do this !requestcommand !kappa-face sends a kappa face in chat");
		}
		
    },
	"pm": {
        usage: "<command> <@personsname> <message>",
        description: 'Private Messages someone.',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, msg.author + " Said:  " + message)
		}
		
    },
	"promotion_ninja": {
        usage: "<command> <@personsname> <message>",
        description: 'Private Messages someone.',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, "You are now a Ninja you can sneak around and are much deadlier than the samurai scum! Enjoy your new found freedom.")
		}
		
    },
	"promotion_wizard": {
        usage: "<command> <@personsname> <message>",
        description: 'Private Messages someone.',
		process: function(bot, msg, suffix) {
			var args = suffix.split('');
            var user = args.shift();
            var message = args.join('');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, "You are now a wizard and have been entrusted with powers of great magnitude. You can weave spells from your fingertips and destroy cities with a single spell.")
		}
		
    },
	"promotion_immortal": {
        usage: "<command> <@personsname> <message>",
        description: 'Private Messages someone.',
		process: function(bot, msg, suffix) {
			var args = suffix.split('');
            var user = args.shift();
            var message = args.join('');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, "You have been promoted to Immortal, here is the promotion message: You are beyond all mortal imagining, your power is immense. You are able to create or destroy worlds in an instant. Some may call you a legend and some. A monster, it is up to you how you use your new found powers.")
		}
		
    },
	"gm": {
        usage: "<command> <@personsname>",
        description: 'Sends good morning message.',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, msg.author + " Says good morning! :)")
		}
		
    },
	"wakeup": {
        usage: "<command> <@personsname>",
        description: 'Sends wakeup message.',
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
				bot.sendMessage(target, msg.author + " Wants you to wakeup")
				bot.sendMessage(target, msg.author + " Wants you to wakeup")
				bot.sendMessage(target, msg.author + " Wants you to wakeup")
				bot.sendMessage(target, msg.author + " Wants you to wakeup")
				bot.sendMessage(target, msg.author + " Wants you to wakeup")
		}
		
    },
	"warning": {
		description: "Do not use unless you are a Mod or Admin or higher...",
		process: function(bot, msg, suffix) {
			var args = suffix.split(' ');
            var user = args.shift();
            var message = args.join(' ');
            if (user.startsWith('<@')) {
                user = user.substr(2, user.length - 3);
            }
			
            var target = msg.channel.server.members.get("id", user);
            if (!target) {
                target = msg.channel.server.members.get("username", user);
            }
			
		bot.sendMessage(target, "You have been warned by " + msg.author + " here is the message:  " + message)
		}
		
    },
};
try{
var rssFeeds = require("./rss.json");
function loadFeeds(){
    for(var cmd in rssFeeds){
        commands[cmd] = {
            usage: "[count]",
            description: rssFeeds[cmd].description,
            url: rssFeeds[cmd].url,
            process: function(bot,msg,suffix){
                var count = 1;
                if(suffix != null && suffix != "" && !isNaN(suffix)){
                    count = suffix;
                }
                rssfeed(bot,msg,this.url,count,false);
            }
        };
    }
}
} catch(e) {
    console.log("Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: " + e);
}

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

try{
	messagebox = require("./messagebox.json");
} catch(e) {
	//no stored messages
	messagebox = {};
}
function updateMessagebox(){
	require("fs").writeFile("./messagebox.json",JSON.stringify(messagebox,null,2), null);
}

function rssfeed(bot,msg,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        bot.sendMessage(msg.channel,"failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count){
            return;
        }
        var item = stream.read();
        bot.sendMessage(msg.channel,item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                bot.sendMessage(msg.channel,text);
            }
        });
        stream.alreadyRead = true;
    });
}


var bot = new Discord.Client();

bot.on("ready", function () {
    loadFeeds();
	console.log("Ready to begin! Serving in " + bot.channels.length + " channels");
	require("./plugins.js").init();
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error
	
});

bot.on("message", function (msg) {
	//check if message is a command
	if(msg.author.id != bot.user.id && (msg.content[0] === '!' || msg.content.indexOf(bot.user.mention()) == 0)){
        console.log("treating " + msg.content + " from " + msg.author + " as command");
		var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
        if(msg.content.indexOf(bot.user.mention()) == 0){
			try {
				cmdTxt = msg.content.split(" ")[1];
				suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+2);
			} catch(e){ //no command
				bot.sendMessage(msg.channel,"Yes?");
				return;
			}
        }
		alias = aliases[cmdTxt];
		if(alias){
			console.log(cmdTxt + " is an alias, constructed command is " + alias.join(" ") + " " + suffix);
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
			bot.sendMessage(msg.author,"Available Commands:", function(){
				for(var cmd in commands) {
					var info = "!" + cmd;
					var usage = commands[cmd].usage;
					if(usage){
						info += " " + usage;
					}
					var description = commands[cmd].description;
					if(description){
						info += "\n\t" + description;
					}
					bot.sendMessage(msg.author,info);
				}
			});
        }
		else if(cmd) {
			try{
				cmd.process(bot,msg,suffix);
			} catch(e){
				if(Config.debug){
					bot.sendMessage(msg.channel, "command " + cmdTxt + " failed :(\n" + e.stack);
				}
			}
		} else {
			if(Config.respondToInvalid){
				bot.sendMessage(msg.channel, "Invalid command " + cmdTxt);
			}
		}
	} else {
		//message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if(msg.author == bot.user){
            return;
        }
        
        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
                bot.sendMessage(msg.channel,msg.author + ", you called?");
        }
    }
});
 

//Log user status changes
bot.on("presence", function(user,status,gameId) {
	//if(status === "online"){
	//console.log("presence update");
	//console.log(user+" went "+status);
	//}
	try{
	if(status != 'offline'){
		if(messagebox.hasOwnProperty(user.id)){
			console.log("found message for " + user.id);
			var message = messagebox[user.id];
			var channel = bot.channels.get("id",message.channel);
			delete messagebox[user.id];
			updateMessagebox();
			bot.sendMessage(channel,message.content);
		}
	}
	}catch(e){}
});

function get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": giphy_config.api_key,
            "rating": giphy_config.rating,
            "format": "json",
            "limit": 1
        };
        var query = qs.stringify(params);

        if (tags !== null) {
            query += "&tag=" + tags.join('+')
        }

        //wouldnt see request lib if defined at the top for some reason:\
        var request = require("request");
        //console.log(query)
        request(giphy_config.url + "?" + query, function (error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                try{
                    var responseObj = JSON.parse(body)
                    func(responseObj.data.id);
                }
                catch(err){
                    func(undefined);
                }
            }
        }.bind(this));
    }
exports.addCommand = function(commandName, commandObject){
    try {
        commands[commandName] = commandObject;
    } catch(err){
        console.log(err);
    }
}
exports.commandCount = function(){
    return Object.keys(commands).length;
}

bot.login(AuthDetails.email, AuthDetails.password);
