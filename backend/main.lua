local http = require("http")
local millennium = require("millennium")


local function get_tier_color(tier)
    local colors = {
        platinum = "#b5e2ff",
        gold = "#cfaf1d",
        silver = "#a5a5a5",
        bronze = "#cd7f32",
        unavailable = "#ff4444"
    }
    return colors[tier] or "#ffffff"
end

local function inject_proton_status(appid)
    local url = "https://www.protondb.com/api/v1/reports/summaries/" .. appid .. ".json"
    
    http.get(url, function(success, response)
        if not success or response.status ~= 200 then return end
        
        local data = response.json()
        local tier = data.tier or "unknown"
        local color = get_tier_color(tier)

        millennium.ui.insert_before(".apphub_AppName", [[
            <div style="
                display: inline-block;
                padding: 5px 15px;
                background-color: ]] .. color .. [[;
                color: black;
                border-radius: 4px;
                font-weight: bold;
                margin-bottom: 10px;
                cursor: pointer;
            " onclick="window.open('https://www.protondb.com/app/]] .. appid .. [[')">
                ProtonDB: ]] .. tier:upper() .. [[
            </div>
        ]])
    end)
end

millennium.on_page_load(function(url)
    local appid = url:match("store.steampowered.com/app/(%d+)")
    
    if appid then
        inject_proton_status(appid)
    end
end)