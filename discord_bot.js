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
    "y": {
        usage: "<video tags>",
        description: "gets youtube video matching tags",
        process: function(bot, msg, suffix) {
            youtube_plugin.respond(suffix, msg.channel, bot);
        }
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
    /*"version": {
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
    },*/
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
	/*"eval": {
		usage: "<command>",
		description: 'Executes arbitrary javascript in the bot process. User must have "eval" permission',
		process: function(bot,msg,suffix) {
			if(Permissions.checkPermission(msg.author,"eval")){
				bot.sendMessage(msg.channel, eval(suffix,bot));
			} else {
				bot.sendMessage(msg.channel, msg.author + " doesn't have permission to execute eval!");
			}
		}
	},*/
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
	"lf": {
        description: '',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "( ͡° ͜ʖ ͡°)");
        }
    },
	"whats_dn": {
        description: 'Tells you what DN stands for.',
        process: function(bot, msg, suffix) {
			bot.sendMessage(msg.channel, "DN is a shortened term for Dragon Nest. It is an MMORPG. \nYou can check out the game here <https://www.youtube.com/results?search_query=dragon+nest> \nYou can find different region versions of DN. The links can be found below to all the different DN versions. \nDN NA <http://dragonnest.nexon.net/landing/> \nDN SEA <http://dn.cherrycredits.com/> \nDN TW <http://dn.gameflier.com/> \nDN CN <http://dn.sdo.com/web10/index/index.html> \nDN JP <http://dragonnest.hangame.co.jp/> \nDN EU <http://www.dragonnest.eu/> \nDN RU <https://dn.mail.ru/> \nDN KR <http://dn.pupugame.com/> \nDN KR is by far the most updated. Because it is the original DN.");
		}
    },
	"whats_tctd": {
		description: 'Tells you what TCTD stands for',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "TCTD is a shortened term for Tom Clancy's The Division, It is an MMORPG. \nYou can check out the game here <https://www.youtube.com/results?search_query=tom+clancy%27s+the+division> \nHere is the game's website <http://tomclancy-thedivision.ubi.com/game/en-au/home/>");
        }
    },
	"whats_lol": {
		description: 'Tells you what LoL stands for',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "LoL is a shortened term for League of Legends it is a MOBA. \nYou can check out the game here <https://www.youtube.com/results?search_query=league+of+legends> \nLoL has multiple regions for the game. Links to each region can be found below\nLoL NA <https://leagueoflegends.com> \nLoL OCE <http://oce.leagueoflegends.com/> \nLoL EU <http://euw.leagueoflegends.com/> \nLoL RU <http://ru.leagueoflegends.com/> \nLoL KR <https://kr.leagueoflegends.com/> \nLoL CN <http://lol.qq.com/> \nLoL JP <http://jp.leagueoflegends.com/> \nLoL TW <https://lol.garena.tw/>");
        }
    },
	"whats_osu!": {
		description: 'Tells you what osu! is',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "osu! is a rythm game, it is pronounced oss. Here is some gameplay videos on it. <https://www.youtube.com/results?search_query=osu%21+gameplay> \nHere is the website for osu! <https://osu.ppy.sh/>");
        }
    },
	"animus": {
        description: 'Gives you an invite link so you can invite your friends also links you the official Animus website!',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "Here is the invite link: https://discord.gg/0abEJoLeXf9kswil");
			bot.sendMessage(msg.channel, "Here is the Animus website: http://animus.site88.net/");
        }
    },
	"memeids": {
        description: 'Gives you a link to the list of meme IDs',
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "https://api.imgflip.com/popular_meme_ids");
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
	"aa3c": {
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, "https://github.com/Axecident/aika");
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
	"profilepic": {
		description: "Gives you Aika's profile picture",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.author, "My profile pic is here: http://puu.sh/ogyB6/fb3e2430f6.png");
			bot.sendMessage(msg.author, "My full un-cropped profile pic is here: http://www.wallpaperup.com/uploads/wallpapers/2015/08/14/777349/c6421eada1044fefa35e6fdf925effaf.jpg");
        }
    },
	"playlist_alex": {
        description: "plays alex's playlist",
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
			console.log("playlist_alex has been started by " + msg.author)
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
	"promotion_user": {
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
				bot.sendMessage(channel, target + " You have been promoted to the rank of User. :)");
		}

    },
	"promotion_veteran": {
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
				bot.sendMessage(channel, target + " You have been promoted to the rank of Veteran User. Thank you for not breaking the rules. :)");
		}

    },
	"promotion_immortal": {
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
						bot.sendMessage(msg.channel, "?role_remove " + target + " Veteran User");
						bot.sendMessage(msg.channel, "?role_add " + target + " Immortal User");
						bot.sendMessage(msg.channel, "?prune 3")
				bot.sendMessage(target, target + " You have been promoted to the rank of Immortal User. You are very trusted by the staff members at Animus now. We hope it stays that way. Please enjoy your new benefits that come with your rank. :)");
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
				bot.sendMessage(target, " good morning " + target + " this message was sent by " + msg.author)
		}

    },
	"gn": {
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
