const headers = {"Authorization": "Bearer <WK API TOKEN HERE>"};

const cache_filename = "wk_wallpaper_data.json";

const dimensions = {
  width: 1418,
  height: 3072,
  top_buffer: 192 + 132,
  bottom_buffer: 192 + 102,
  left_buffer: 88,
  right_buffer: 88,
}

const colors = [
  "303030",
  "DD0093",
  "DD0093",
  "DD0093",
  "DD0093",
  "882D8A",
  "882D8A",
  "294DDB",
  "0093DD",
  "FAAC05"
]

async function get_wk_data() {
  //let fm = FileManager.local()
  let path = "./wkcache/" + cache_filename //fm.joinPath(fm.cacheDirectory(), cache_filename)

let override = false
// override = true
  let cacheExists = false;

  let fileList = listFiles("./wkcache/", false)
  let files

  if(fileList === undefined)
  {
    cacheExists = false;
  }
  else
  {
    files = fileList.split('\n');
    cacheExists = files.includes(cache_filename);
  }

  if( !cacheExists || override) {
    let url = "https://api.wanikani.com/v2/subjects?types=kanji";

    kanji = {}
    
    while(url) {
      $.ajax({
        dataType: "json",
        url: url,
        headers : headers,
        success: function (response) {
          //response = JSON.parse(jsonData);
          url = response.pages.next_url;
          response.data.forEach((new_kanji) => {
            kanji[new_kanji.data.characters] = new_kanji.id
          });
        },
        async: false
      });

      // let request = new Request(url);
      // request.headers = headers;
      // let response = await request.loadJSON();
      // url = response.pages.next_url;
    
      // response.data.forEach((new_kanji) => {
      //   kanji[new_kanji.data.characters] = new_kanji.id
      // });
    }
    
    url = 'https://api.wanikani.com/v2/assignments?subject-types=kanji'
    
    srs = {}
    
    while(url) {

      $.ajax({
        dataType: "json",
        url: url,
        headers : headers,
        success: function (response) {
          //response = JSON.parse(jsonData);
          url = response.pages.next_url;     
          response.data.forEach((new_item) => {
            srs[new_item.data.subject_id] = new_item.data.srs_stage;
          });
        },
        async: false
      });

      // let request = new Request(url);
      // request.headers = headers;
      // let response = await request.loadJSON();
      // url = response.pages.next_url;
      
      // response.data.forEach((new_item) => {
      //   srs[new_item.data.subject_id] = new_item.data.srs_stage;
      // });
    }
    
    let wk_data = {
      kanji,
      srs
    }
    
    let image_params = await calculate_image_params(wk_data)
    
    let cache_data = {
      updated_time: new Date().toISOString(),
      wk_data,
      image_params,
    }
    
    writeFile(path, JSON.stringify(cache_data), false)
    //await fm.writeString(path, JSON.stringify(cache_data))
    return cache_data
  } else {
    //let cache_data = await JSON.parse(fm.readString(path))
    let cache_data = await JSON.parse(readFile(path))
  
    url = 'https://api.wanikani.com/v2/assignments?subject-types=kanji&updated_after=' + cache_data.updated_time

    let updated = false
    
    while(url) {
      $.ajax({
        dataType: "json",
        url: url,
        headers : headers,
        success: function (response) {
          //response = JSON.parse(jsonData);
          url = response.pages.next_url;
      
          response.data.forEach((new_item) => {
            let id = new_item.data.subject_id
            let old_srs = cache_data.wk_data.srs[id]
            let new_srs = new_item.data.srs_stage
            
            if(colors[old_srs] != colors[new_srs]) {
              updated = true
            }
            
            cache_data.wk_data.srs[id] = new_srs;
          });
        },
        async: false
      });


      // let request = new Request(url);
      // request.headers = headers;
      // let response = await request.loadJSON();
      // url = response.pages.next_url;
      
      // response.data.forEach((new_item) => {
      //   let id = new_item.data.subject_id
      //   let old_srs = cache_data.wk_data.srs[id]
      //   let new_srs = new_item.data.srs_stage
        
      //   if(colors[old_srs] != colors[new_srs]) {
      //     updated = true
      //   }
        
      //   cache_data.wk_data.srs[id] = new_srs;
      // });
    }
    
    cache_data.updated_time = new Date().toISOString()
    writeFile(path, JSON.stringify(cache_data), false)
    //await fm.writeString(path, JSON.stringify(cache_data))
    
    if(!updated) {
      return
    }
    
    return cache_data
  }
}

async function calculate_image_params(wk) {
  const w = dimensions.width - dimensions.left_buffer - dimensions.right_buffer
  const h = dimensions.height - dimensions.top_buffer - dimensions.bottom_buffer

  potential_s = []
  let r = 1
  let n = Object.keys(wk.kanji).length
//   n = 14269
  for(let i = 1; i <= w; i++) {
    potential_s.push(w / i)
  }
    
  for(let j = 1; j <= h; j++) {
    potential_s.push(h / j / r)
  }
    
  potential_s.sort((a, b) => b - a)
  
  let s
  let rows
  let cols
  let x_offset
  let y_offset
  
  for(let i = 0; i < potential_s.length; i++) {
    s = potential_s[i]
    
    cols = Math.floor(w / s)
    rows = Math.floor(h / r / s)
    
    if(rows * cols < n) {
      continue
    }
    
    x_offset = (w - cols * s) / 2
    y_offset = (h - rows * r * s) / 2
    break
  }
  
  return {
    adjusted_width: w,
    adjusted_height: h,
    rows,
    cols,
    x_offset,
    y_offset,
    s,
    r,
  }
}

async function get_image_data(
  data,
  dim,
  colors
) {

  let c = document.createElement('canvas');
  c.width = 1440;
  c.height = 3120;

  let ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.rect(0, 0, c.width, c.height);
  ctx.fillStyle = "black";
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = '72px serif';
  ctx.fillText('鉄緑一二鉄緑一二鉄緑一二', 100, 500);


  // let cx = new DrawContext()
  // cx.size = new Size(dimensions.width, dimensions.height)
  // cx.opaque = true
  // cx.setFillColor(Color.black())
  // cx.fill(new Rect(0, 0, dimensions.width, dimensions.height))
  
  // cx.setFont(Font.heavySystemFont(data.image_params.s))
  // cx.setTextAlignedCenter()
  
  // let cols = data.image_params.cols
  // let s = data.image_params.s
  // let r = data.image_params.r
  // let l_buff = dimensions.left_buffer + data.image_params.x_offset
  // let t_buff = dimensions.top_buffer + data.image_params.y_offset
  
  // let kanji = Object.keys(data.wk_data.kanji)
  
  // for(let i = 0; i < kanji.length; i++) {
  //   let x = i % data.image_params.cols
  //   let y = Math.floor(i / data.image_params.cols)
    
  //   let k = kanji[i]
  //   let id = data.wk_data.kanji[k]
  //   let srs = data.wk_data.srs[id] || 0
  //   let color = new Color(colors[srs])
    
  //   let rect = new Rect(
  //     l_buff + x * s,
  //     t_buff + y * s * r,
  //     s,
  //     s * r,
  //   )
    
  //   cx.setTextColor(color)
  //   cx.drawTextInRect(kanji[i], rect)
  // }
  
  // let image = cx.getImage()
  
  return c
}



(async() => {
  console.log('before start');

  try {
  let data = await get_wk_data()
  
  if(data !== undefined) {
    let c = await get_image_data(
      data,
      dimensions,
      colors,
    )
    
    setLocal("canvas_image", c.toDataURL());

    // let raw_image = Data.fromPNG(image)
    // let base64_image = raw_image.toBase64String()
    //Script.setShortcutOutput(base64_image)
  }
} finally {
  //Script.complete()
}
  
  console.log('after start');
  
  exit();
})();
