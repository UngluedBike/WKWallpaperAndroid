const headers = {"Authorization": "Bearer " + local("api_key") };

const cache_filename = "wk_wallpaper_data.json";

const screen_resolution = local("screen_res").split('x');
const screen_buffers = local("screen_buf").split(',').map(Number); // top, bottom, left, right

const dimensions = {
  width: screen_resolution[0],
  height: screen_resolution[1],
  top_buffer: screen_buffers[0],
  bottom_buffer: screen_buffers[1],
  left_buffer: screen_buffers[2],
  right_buffer: screen_buffers[3]
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

  let path = "./wkcache/" + cache_filename

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
          url = response.pages.next_url;
          response.data.forEach((new_kanji) => {
            kanji[new_kanji.data.characters] = new_kanji.id
          });
        },
        async: false
      });
    }
    
    url = 'https://api.wanikani.com/v2/assignments?subject-types=kanji'
    
    srs = {}
    
    while(url) {

      $.ajax({
        dataType: "json",
        url: url,
        headers : headers,
        success: function (response) {
          url = response.pages.next_url;     
          response.data.forEach((new_item) => {
            srs[new_item.data.subject_id] = new_item.data.srs_stage;
          });
        },
        async: false
      });
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

    return cache_data
  } else {

    let cache_data = await JSON.parse(readFile(path))
  
    url = 'https://api.wanikani.com/v2/assignments?subject-types=kanji&updated_after=' + cache_data.updated_time

    let updated = false
    
    while(url) {
      $.ajax({
        dataType: "json",
        url: url,
        headers : headers,
        success: function (response) {
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

    }
    
    cache_data.updated_time = new Date().toISOString()
    writeFile(path, JSON.stringify(cache_data), false)
    
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
  c.width = dimensions.width;
  c.height = dimensions.height;

  let ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.rect(0, 0, c.width, c.height);
  ctx.fillStyle = "black";
  ctx.fill();

  ctx.font = data.image_params.s + 'px serif';
  ctx.textAlign = "center";

  
  let cols = data.image_params.cols // Number of columns
  let s = data.image_params.s // Size of each character.
  let r = data.image_params.r
  let l_buff = dimensions.left_buffer + data.image_params.x_offset
  let t_buff = dimensions.top_buffer + data.image_params.y_offset
  
  let kanji = Object.keys(data.wk_data.kanji)
  
  for(let i = 0; i < kanji.length; i++) {

    // Determines the coordinate of each kanji
    let x = i % cols
    let y = Math.floor(i / cols)
    
    // stores the current kanji
    let k = kanji[i]

    // Gets the id of the kanji to determine the current srs level.
    let id = data.wk_data.kanji[k]
    let srs = data.wk_data.srs[id] || 0

    // stores the colour of the current kanji
    let color = colors[srs]
    ctx.fillStyle = "#" + color;


    ctx.fillText(k, (l_buff + x * s) + (s/2), (t_buff + y * s * r) + (s/2));
  }
  
  return c
}

// Startup code is enclosed in async delegate
// Because tasker does not support async functions in main body
(async() => {

  try {
  let data = await get_wk_data()
  
  if(data !== undefined) {
    let c = await get_image_data(
      data,
      dimensions,
      colors,
    )
    
    setLocal("canvas_image", c.toDataURL());
  }
  } finally {
    exit();
  }
  
})();
