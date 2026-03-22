local http = require("http")
local json = require("json")
local logger = require("logger")
local millennium = require("millennium")

local UNKNOWN_RATING = json.encode({ tier = "unknown", confidence = "low" })

--- Fetch ProtonDB rating for a given Steam app ID.
--- Called from the frontend via callable("GetProtonDBRating").
function GetProtonDBRating(params)
    local appid = tostring(params.appid or params)
    local url = "https://www.protondb.com/api/v1/reports/summaries/" .. appid .. ".json"

    local response, err = http.get(url, { timeout = 10 })

    if not response then
        logger:warn("Request failed for app " .. appid .. ": " .. tostring(err))
        return UNKNOWN_RATING
    end

    if response.status == 404 then
        return UNKNOWN_RATING
    end

    if response.status ~= 200 then
        logger:warn("Unexpected status " .. tostring(response.status) .. " for app " .. appid)
        return UNKNOWN_RATING
    end

    local ok, data = pcall(json.decode, response.body)
    if not ok then
        logger:error("Failed to parse response: " .. tostring(data))
        return UNKNOWN_RATING
    end

    return json.encode({
        tier = data.tier or "unknown",
        confidence = data.confidence or "low",
        score = data.score or 0,
        total = data.total or 0,
        trendingTier = data.trendingTier or data.tier or "unknown"
    })
end

local function on_load()
    logger:info("ProtonDB Extension loaded")
    millennium.ready()
end

return {
    on_load = on_load
}
