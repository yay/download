import https from 'https';
import fs from 'fs';

function httpGet(options) {
    return new Promise((resolve, reject) => {
        const req = https.get(options, res => {
            let text = '';
            res.setEncoding('binary');
            res.on('data', chunk => text += chunk);
            res.on('end', () => {
                resolve({
                    text,
                    response: res,
                    json: () => JSON.parse(text)
                });
            });
        });
        req.on('error', error => reject(error));
        req.end();
    });
}

function* makeChunkUrlIterator(startIndex = 0) {
    let index = startIndex;
    while (true) {
        // const number = String(index).padStart(5, '0');
        // yield `https://.../${index}.ts`;
        index++;
    }
}

function* makeImageUrlIterator(startIndex = 1) {
    let index = startIndex;
    while (true) {
        const stringIndex = String(index).padStart(3, '0');
        yield `https://...${stringIndex}.jpg`;
        index++;
    }
}

function getFile(iterator, writeStream) {
    const result = iterator.next();
    if (result.done) {
        return;
    }

    const url = result.value;
    if (!url) {
        return;
    }

    httpGet(url).then(result => {
        const status = result.response.statusCode;
        if (status >= 200 && status < 400 && result.text) {
            if (writeStream) {
                writeStream.write(result.text);
            } else {
                const savePath = `${process.cwd()}/downloads/${url.split('/').slice(-1)}`;
                fs.writeFile(savePath, result.text, { encoding: 'binary' }, err => {
                    if (err) throw err;
                });
            }
            console.log(`Fetched ${result.text.length} bytes from ${url}`);
            getFile(iterator, writeStream);
        } else {
            console.log('Downloaded all chunks');
            if (writeStream) {
                writeStream.close();
            }
        }
    }).catch(reason => {
        console.error(reason);
    });
}

function saveVideo(iterator, fileName = 'stream.ts') {
    const writeStream = fs.createWriteStream(`${process.cwd()}/${fileName}`, {
        encoding: 'binary',
        flags: 'a'
    });
    console.log(`Saving stream to ${writeStream.path}`);
    getFile(iterator, writeStream);
}

function concatFiles() {
    const writeStream = fs.createWriteStream(`${process.cwd()}/out.ts`, {
        encoding: 'binary',
        flags: 'a'
    });

    const mediaFolder = `${process.cwd()}/media/`;

    const files = fs.readdirSync(mediaFolder);
    files.forEach((file, index) => {
        const buffer = fs.readFileSync(mediaFolder + file, {
            encoding: 'binary'
        });
        console.log(index, buffer.length);
        writeStream.write(buffer);
    });

    writeStream.close();
}

function savePartial(fileName = 'partial.ts') {
    const writeStream = fs.createWriteStream(`${process.cwd()}/${fileName}`, {
        encoding: 'binary',
        flags: 'a'
    });

    console.log(`Saving stream to ${writeStream.path}`);

    const url = 'https://p218.anyhentai.com/IDlXfFdVbV8AB3E=.mp4?st=nKsJZoouzi9kqPgCcwRyuA&e=1647555652';

    (new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'identity;q=1, *;q=0',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Range': 'bytes=0-',
                'Referer': 'https://javhub.net/play/DOAFm-EhaB9I9J3zA2aiYaaum6iE-O3LPE2CMwBLz3M/mdl-318-disposable-m-slave-tsukasa-imai',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Sec-Fetch-Dest': 'video',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36'
            }
        }, res => {
            console.log('Status code:', res.statusCode);
            res.pipe(writeStream);
            res.on('end', () => {
                console.log('Downloaded');
                resolve(res);
            });
        });
        req.on('error', error => reject(error));
        req.end();
    })).then(res => {
        writeStream.close();
    }).catch(reason => {
        console.error(reason);
    });
}

// getFile(makeImageUrlIterator(1));
saveVideo(makeChunkUrlIterator(1));
// savePartial();
// concatFiles();