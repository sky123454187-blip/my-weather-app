import { useState, useEffect } from 'react'
import './App.css'
import { taiwanData } from './taiwanData.js'

// 使用導入的台灣地理數據
const taiwanLocations = taiwanData

// 保留預設城市（如果需要）
const defaultCities = [
]

// 天氣圖示對應表
const weatherIcons = {
  0: '☀️',    // 晴天
  1: '🌤️',   // 主要晴朗
  2: '⛅',    // 部分多雲
  3: '☁️',    // 陰天
  45: '🌫️',  // 霧
  48: '🌫️',  // 凝結霧
  51: '🌦️',  // 輕毛毛雨
  53: '🌧️',  // 中等毛毛雨
  55: '🌧️',  // 濃密毛毛雨
  61: '🌧️',  // 輕雨
  63: '🌧️',  // 中等雨
  65: '⛈️',  // 大雨
  71: '❄️',   // 輕雪
  73: '❄️',   // 中等雪
  75: '❄️',   // 大雪
  77: '❄️',   // 雪粒
  80: '🌧️',  // 輕陣雨
  81: '⛈️',  // 中等陣雨
  82: '⛈️',  // 暴雨
  85: '❄️',   // 輕陣雪
  86: '❄️',   // 重陣雪
  95: '⛈️',  // 雷暴
  96: '⛈️',  // 有冰雹的雷暴
  99: '⛈️'   // 有大冰雹的雷暴
}

export default function App() {
  const [city, setCity] = useState('台北市')
  const [currentCoords, setCurrentCoords] = useState({ lat: 25.0330, lon: 121.5654 })
  const [searchInput, setSearchInput] = useState('')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('weatherFavorites')
    return saved ? JSON.parse(saved) : []
  })
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState([])
  const [selectedForCompare, setSelectedForCompare] = useState([])

  // 搜索城市（使用預設台灣城鎮列表）
  const searchCity = async (cityName) => {
    setLoading(true)
    setError('')

    // 從預設列表搜索
    const found = taiwanLocations.find(loc =>
      loc.name.includes(cityName) || cityName.includes(loc.name)
    )

    if (found) {
      setCity(found.name)
      setCurrentCoords({ lat: found.lat, lon: found.lon })
      fetchWeather(found.name)
    } else {
      setError(`找不到「${cityName}」，請從建議中選擇或試試其他城鎮名稱`)
      setLoading(false)
    }
  }

  // 收藏城市
  const toggleFavorite = () => {
    const isFavorited = favorites.some(fav => fav.name === city)

    let newFavorites
    if (isFavorited) {
      newFavorites = favorites.filter(fav => fav.name !== city)
    } else {
      newFavorites = [...favorites, { name: city, lat: currentCoords.lat, lon: currentCoords.lon }]
    }

    setFavorites(newFavorites)
    localStorage.setItem('weatherFavorites', JSON.stringify(newFavorites))
  }

  // 快速查看收藏的城市
  const loadFavorite = (fav) => {
    setCity(fav.name)
    setCurrentCoords({ lat: fav.lat, lon: fav.lon })
    fetchWeather(fav.name)
  }

  // 判斷當前城市是否已收藏
  const isFavorited = favorites.some(fav => fav.name === city)

  // 獲取天氣數據 - 使用中央氣象署 API
  const CWA_API_KEY = 'CWA-E142368F-F6DA-457A-AEDF-3D5BCF20BFF1'

  const fetchWeather = async (cityName) => {
    try {
      const cwaUrl = `https://opendata.cwa.gov.tw/api/v1/rest/forecasts?locationName=${encodeURIComponent(cityName)}&Authorization=${CWA_API_KEY}`
      const url = `https://weather.sky123454187.workers.dev/?url=${encodeURIComponent(cwaUrl)}`
      console.log('Fetching weather from CWA via Worker:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Weather data received:', data)

      if (data.records && data.records.location && data.records.location.length > 0) {
        const location = data.records.location[0]

        // 提取當前天氣和預報
        const weatherData = processWeatherData(location.weatherElement)
        setWeather(weatherData.current)
        setForecast(weatherData.forecast)
        setError('')
      } else {
        throw new Error('未找到該地區的天氣資料')
      }
      setLoading(false)
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError(`獲取天氣失敗: ${err.message}`)
      setLoading(false)
    }
  }

  // 處理中央氣象署的天氣數據
  const processWeatherData = (weatherElements) => {
    const current = {}
    const forecast = { time: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_probability_max: [], weather_code: [] }

    weatherElements.forEach(element => {
      const name = element.elementName
      if (element.time && element.time.length > 0) {
        const firstTime = element.time[0]

        // 處理當前天氣
        if (name === '氣溫') current.temperature_2m = parseFloat(firstTime.parameter?.parameterValue) || 0
        if (name === '相對濕度') current.relative_humidity_2m = parseInt(firstTime.parameter?.parameterValue) || 0
        if (name === '風速' || name === '風速(平均)') current.wind_speed_10m = parseFloat(firstTime.parameter?.parameterValue) * 3.6 || 0 // 轉換為 km/h
        if (name === '天氣現象') current.weather_code = getWeatherCode(firstTime.parameter?.parameterValue)

        // 處理預報資料
        if (name === '最高溫度') {
          element.time.forEach(t => forecast.temperature_2m_max.push(parseFloat(t.parameter?.parameterValue) || 0))
          element.time.forEach(t => forecast.time.push(t.startTime?.split('T')[0]))
        }
        if (name === '最低溫度') {
          element.time.forEach(t => forecast.temperature_2m_min.push(parseFloat(t.parameter?.parameterValue) || 0))
        }
        if (name === '降雨機率') {
          element.time.forEach(t => forecast.precipitation_probability_max.push(parseInt(t.parameter?.parameterValue) || 0))
        }
        if (name === '天氣現象') {
          element.time.forEach(t => forecast.weather_code.push(getWeatherCode(t.parameter?.parameterValue)))
        }
      }
    })

    return { current, forecast }
  }

  // 將中央氣象署天氣代碼轉換為 WMO 代碼
  const getWeatherCode = (cwaDescription) => {
    if (!cwaDescription) return 0
    const desc = cwaDescription.toLowerCase()

    if (desc.includes('晴')) return 0
    if (desc.includes('多雲') || desc.includes('陰')) return 3
    if (desc.includes('陣雨') || desc.includes('雷')) return 80
    if (desc.includes('雨')) return 61
    if (desc.includes('雪')) return 71
    if (desc.includes('霧')) return 45

    return 0
  }

  // 首次載入時搜索預設城市
  useEffect(() => {
    const defaultCity = taiwanLocations.find(loc => loc.name === city)
    if (defaultCity) {
      setCurrentCoords({ lat: defaultCity.lat, lon: defaultCity.lon })
      fetchWeather(city)
    }
  }, [])

  // 獲取搜索建議（從預設台灣城鎮列表）
  const handleInputChange = (value) => {
    setSearchInput(value)

    if (value.length < 1) {
      setSuggestions([])
      return
    }

    const inputLower = value.toLowerCase()

    // 優先搜索：精確匹配（完全相符的縣市）
    const perfectMatches = taiwanLocations.filter(loc =>
      loc.name.toLowerCase() === inputLower
    )

    // 其次：開頭匹配（包括縣市本身和其下的區鎮鄉）
    const startMatches = taiwanLocations.filter(loc => {
      const locName = loc.name.toLowerCase()
      return locName.startsWith(inputLower) && locName !== inputLower
    }).sort((a, b) => a.name.length - b.name.length)

    // 再次：模糊搜索包含關鍵字的所有地點
    const fuzzyMatches = taiwanLocations.filter(loc => {
      const locName = loc.name.toLowerCase()
      return locName.includes(inputLower) &&
             !locName.startsWith(inputLower) &&
             locName !== inputLower
    }).sort((a, b) => a.name.length - b.name.length)

    // 合併結果：完全匹配 → 開頭匹配 → 模糊匹配
    const allSuggestions = [...perfectMatches, ...startMatches, ...fuzzyMatches]
    setSuggestions(allSuggestions)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      searchCity(searchInput)
      setSearchInput('')
      setSuggestions([])
    }
  }

  const selectSuggestion = (location) => {
    setCity(location.name)
    setCurrentCoords({ lat: location.lat, lon: location.lon })
    setSearchInput('')
    setSuggestions([])
    fetchWeather(location.name)
  }

  // 比較模式：加入城市到比較列表
  const addToCompare = () => {
    if (compareList.length < 5 && weather && forecast) {
      const isAlreadyAdded = compareList.some(item => item.name === city)
      if (!isAlreadyAdded) {
        setCompareList([...compareList, {
          name: city,
          lat: currentCoords.lat,
          lon: currentCoords.lon,
          weather: weather,
          forecast: forecast
        }])
      }
    }
  }

  // 清除比較列表
  const clearCompare = () => {
    setCompareList([])
  }

  // 從比較列表中移除城市
  const removeFromCompare = (cityName) => {
    setCompareList(compareList.filter(item => item.name !== cityName))
  }

  // 切換選中的最愛城市
  const toggleSelectedForCompare = (favName) => {
    if (selectedForCompare.includes(favName)) {
      setSelectedForCompare(selectedForCompare.filter(name => name !== favName))
    } else {
      if (selectedForCompare.length < 5) {
        setSelectedForCompare([...selectedForCompare, favName])
      }
    }
  }

  // 開始比較選中的最愛城市
  const startComparison = async () => {
    if (selectedForCompare.length === 0) return

    const newCompareList = []
    for (const favName of selectedForCompare) {
      const fav = favorites.find(f => f.name === favName)
      if (fav) {
        try {
          const cwaUrl = `https://opendata.cwa.gov.tw/api/v1/rest/forecasts?locationName=${encodeURIComponent(favName)}&Authorization=${CWA_API_KEY}`
          const url = `https://weather.sky123454187.workers.dev/?url=${encodeURIComponent(cwaUrl)}`
          const response = await fetch(url)
          const data = await response.json()

          if (data.records && data.records.location && data.records.location.length > 0) {
            const location = data.records.location[0]
            const weatherData = processWeatherData(location.weatherElement)
            newCompareList.push({
              name: fav.name,
              lat: fav.lat,
              lon: fav.lon,
              weather: weatherData.current,
              forecast: weatherData.forecast
            })
          }
        } catch (err) {
          console.error(`Error fetching weather for ${fav.name}:`, err)
        }
      }
    }
    setCompareList(newCompareList)
    setCompareMode(true)
    setSelectedForCompare([])
  }

  // 退出比較模式
  const exitCompare = () => {
    setCompareMode(false)
    setCompareList([])
    setSelectedForCompare([])
  }

  // 在比較列表中上移城市
  const moveCompareUp = (idx) => {
    if (idx > 0) {
      const newList = [...compareList]
      ;[newList[idx], newList[idx - 1]] = [newList[idx - 1], newList[idx]]
      setCompareList(newList)
    }
  }

  // 在比較列表中下移城市
  const moveCompareDown = (idx) => {
    if (idx < compareList.length - 1) {
      const newList = [...compareList]
      ;[newList[idx], newList[idx + 1]] = [newList[idx + 1], newList[idx]]
      setCompareList(newList)
    }
  }

  return (
    <div className="app">
      {/* 搜索欄 - 固定在頂部 */}
      <div className="search-container">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-label">台灣鄉鎮天氣預報</div>
            <input
              type="text"
              placeholder="搜尋城市、鄉鎮... (如：台北市、彰化縣田中鎮)"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">搜尋</button>
          </form>

          {/* 搜索建議 */}
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((location, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => selectSuggestion(location)}
                >
                  <div className="suggestion-name">{location.name}</div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* 比較模式視圖 */}
      {compareMode && compareList.length > 0 ? (
        <div className="container">
          <div className="compare-view">
            <div className="compare-header">
              <h2 className="compare-title">天氣比較 ({compareList.length}/5)</h2>
              <button className="exit-compare-btn" onClick={exitCompare}>退出比較</button>
            </div>
            {compareList.map((item, itemIdx) => (
              <div key={item.name} className="compare-row">
                <div className="compare-current">
                  <div className="compare-city-header">
                    <h3>{item.name}</h3>
                  </div>
                  <div className="compare-weather">
                    <div className="compare-icon">{weatherIcons[item.weather.weather_code] || '🌡️'}</div>
                    <div className="compare-info">
                      <div className="compare-temp">{Math.round(item.weather.temperature_2m)}°C</div>
                      <div className="compare-details-row">
                        <div className="compare-detail">濕度: {item.weather.relative_humidity_2m}%</div>
                        <div className="compare-detail">風速: {Math.round(item.weather.wind_speed_10m / 3.6)} m/s</div>
                      </div>
                    </div>
                  </div>
                  <div className="compare-controls">
                    <button
                      className="move-btn"
                      onClick={() => moveCompareUp(itemIdx)}
                      disabled={itemIdx === 0}
                      title="上移"
                    >
                      ▲
                    </button>
                    <button
                      className="move-btn"
                      onClick={() => moveCompareDown(itemIdx)}
                      disabled={itemIdx === compareList.length - 1}
                      title="下移"
                    >
                      ▼
                    </button>
                    <button
                      className="remove-compare-btn"
                      onClick={() => removeFromCompare(item.name)}
                      title="移除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="compare-forecast">
                  <div className="compare-forecast-grid">
                    {item.forecast.time.slice(0, 7).map((date, idx) => {
                      const dateObj = new Date(date)
                      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
                      const dayName = weekDays[dateObj.getDay()]
                      const dateStr = dateObj.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })

                      return (
                        <div key={idx} className="compare-forecast-card">
                          <div className="compare-date">{dateStr}</div>
                          <div className="compare-weekday">週{dayName}</div>
                          <div className="compare-forecast-icon">{weatherIcons[item.forecast.weather_code[idx]] || '🌡️'}</div>
                          <div className="compare-temps">
                            <span className="compare-min">{Math.round(item.forecast.temperature_2m_min[idx])}°</span>
                            <span className="compare-max">{Math.round(item.forecast.temperature_2m_max[idx])}°</span>
                          </div>
                          <div className="compare-rain">{Math.round(item.forecast.precipitation_probability_max[idx] || 0)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="container">
          {/* 我的最愛側邊欄 - 固定顯示 */}
          <div className="favorites-sidebar">
            <h3>💖 我的最愛</h3>
            {favorites.length > 0 ? (
              <div className="favorites-list-container">
                <div className="favorites-list">
                  {favorites.map((fav, idx) => (
                    <div key={idx} className="favorite-item-wrapper">
                      <button
                        className={`favorite-item ${fav.name === city ? 'active' : ''}`}
                        onClick={() => loadFavorite(fav)}
                      >
                        {fav.name}
                      </button>
                      <input
                        type="checkbox"
                        className="favorite-checkbox"
                        checked={selectedForCompare.includes(fav.name)}
                        onChange={() => toggleSelectedForCompare(fav.name)}
                        disabled={selectedForCompare.length >= 5 && !selectedForCompare.includes(fav.name)}
                        title={selectedForCompare.includes(fav.name) ? '取消比較' : '加入比較'}
                      />
                    </div>
                  ))}
                </div>
                {favorites.length > 0 && (
                  <button
                    className="add-compare-from-favorites-btn"
                    onClick={startComparison}
                    disabled={selectedForCompare.length === 0}
                  >
                    加入比較 ({selectedForCompare.length || 0}/5)
                  </button>
                )}
              </div>
            ) : (
              <div className="no-favorites">尚無收藏</div>
            )}
          </div>

          <div className="weather-content">
            {error && <div className="error">{error}</div>}

            {loading && <div className="loading">加載中...</div>}

            {/* 當前天氣 - 總是顯示框架 */}
            <div className="weather-card">
              <div className="city-header">
                <div className="city-info">
                  <h1 className="city-name">{city}</h1>
                  <p className="today-date">{weather ? new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }) : '--'}</p>
                </div>
                <button
                  className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
                  onClick={toggleFavorite}
                  title={isFavorited ? '取消收藏' : '收藏此城市'}
                >
                  {isFavorited ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="current-weather">
                {weather ? (
                  <div className="temperature-section">
                    <div className="icon">{weatherIcons[weather.weather_code] || '🌡️'}</div>
                    <div className="temp-info">
                      <div className="temp">{Math.round(weather.temperature_2m)}°C</div>
                      <div className="details-row">
                        <div className="description">濕度: {weather.relative_humidity_2m}%</div>
                        <div className="wind">風速: {Math.round(weather.wind_speed_10m / 3.6)} m/s</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="temperature-section">
                    <div className="icon">❓</div>
                    <div className="temp-info">
                      <div className="temp">--°C</div>
                      <div className="details-row">
                        <div className="description">濕度: --%</div>
                        <div className="wind">風速: -- m/s</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 一周天氣預報 */}
            {forecast && (
              <div className="forecast-section">
                <h2>一周天氣預報</h2>
                <div className="forecast-grid">
                  {forecast.time.slice(0, 7).map((date, idx) => {
                    const dateObj = new Date(date)
                    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
                    const dayName = weekDays[dateObj.getDay()]
                    const dateStr = dateObj.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })

                    return (
                      <div key={idx} className="forecast-card">
                        <div className="date">
                          <div className="date-main">{dateStr}</div>
                          <div className="week-day">週{dayName}</div>
                        </div>
                        <div className="forecast-icon">{weatherIcons[forecast.weather_code[idx]] || '🌡️'}</div>
                        <div className="temps">
                          <span className="min">{Math.round(forecast.temperature_2m_min[idx])}°</span>
                          <span className="max">{Math.round(forecast.temperature_2m_max[idx])}°</span>
                        </div>
                        <div className="rain-prob">
                          💧 {Math.round(forecast.precipitation_probability_max[idx] || 0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
