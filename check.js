#!/usr/bin/env node


const CHECK_URL = [
    "https://raw.githubusercontent.com/dxawi/0/main/tvlive.txt",
    "https://d.kstore.space/download/3329/20230109.txt",
     "https://mirror.ghproxy.com/https://raw.githubusercontent.com/ClodQiu/LIVE/main/IPTV/%E6%97%A0%E7%95%8C.IPTV",
    "https://mirror.ghproxy.com/https://raw.githubusercontent.com/PizazzGY/TVBox/main/live.txt",
    "https://mirror.ghproxy.com/https://raw.githubusercontent.com/victor1616888/TVBOX-Q/master/tvlive.txt",
];

const PROXY_ENV = 'http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890';
const fetch = require('node-fetch');
var exec = require('child_process').exec;

async function verifyurl(url){
    try{
        var res = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
            },
            responseType: 'stream',
            timeout: 3000,
        });
        return true;
    }catch(e){
        // console.log(e);
        return false;
    }
}
async function geturlcontent(url){
    try{
        var res = await execmd(PROXY_ENV + ' ' + 'curl -s -L \"' + url + '\"');
        if(res[0]){
            return '';
        }
        return res[1];
    }catch(e){
        console.log(e);
        return '';
    }
}
async function execmd(cmd){
    console.log(cmd);
    var over = false;
    var waitcall = null;
    var _err, _stdout, _stderr = null;
    exec(cmd, async function(err,stdout,stderr){
        _err = err;
        _stdout = stdout;
        _stderr = stderr;
        if (! over){
            over = true;
            if(waitcall){
                waitcall();
                waitcall = null;
            }
        }
    });
    if (! over){
        await new Promise(r => {waitcall = r});
    }
    return [_err, _stdout, _stderr];
}
async function pushgit(){
    console.log('exec over');
    var gitstatu = await execmd('git add .');
    if (gitstatu[0]){
        console.log('git 提交出错：', gitstatu);
        return;
    }
    var gitstatu = await execmd('git commit -m \"' + '自动提交: $(date)'+ '\"');
    if (gitstatu[0]){
        console.log('git 提交出错：', gitstatu);
        return;
    }
    var gitstatu = await execmd('git push origin master');
    if (gitstatu[0]){
        console.log('git 提交出错：', gitstatu);
        return;
    }
}

async function checkallurl(data){
    var listsplit = data.split('\n');
    await listsplit.reduce(async (memo, ise) => {
        await memo;
        if (! ise || ise == ''){ return 0; }

        var isesplit = ise.trim().split(',');
        if(isesplit.length >= 2){
            if(isesplit[1].trim().indexOf('http')==0){
                if(await verifyurl(isesplit[1].trim())){
                    console.log('append:', ise);
                    await execmd('printf -- \"\n' + ise + '\"' + ' >>live.txt');
                } else {
                    console.log('过滤无法访问的源:', ise);
                }
                return;
            }
        }
        await execmd('printf -- \"\n' + ise + '\"' + ' >>live.txt');
    }, '');
}
async function loadexturl(){
    // const loadlist='https://d.kstore.space/download/3329/20230109.txt'
    await execmd('printf -- \"' + '\"' + ' >live.txt');
    await CHECK_URL.reduce(async (memo, url) => {
        await memo;
        if (! url || url == ''){ return 0; }

        var content = await geturlcontent(url);
        // console.log(content);
        if(content){
            await checkallurl(content);
        }
    }, '');
    await pushgit();
    console.log('状态:', 'over');
    process.exit(0);
}

console.log('开始测试live地址并保存');
loadexturl();
// pushgit();


