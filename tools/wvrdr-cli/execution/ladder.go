package execution

import "math"

type LimitOrder struct {
	Ticker   string
	Action   string // BUY/SELL
	Quantity int
	Price    float64
}

func GenerateLadder(ticker string, action string, totalShares int, midPrice float64) []LimitOrder {
	rungs := 3
	sharesPerRung := totalShares / rungs
	ladder := make([]LimitOrder, 0, rungs)

	for i := 0; i < rungs; i++ {
		offset := midPrice * (0.001 * float64(i))
		price := midPrice
		if action == "BUY" {
			price = midPrice - offset
		} else {
			price = midPrice + offset
		}

		ladder = append(ladder, LimitOrder{
			Ticker:   ticker,
			Action:   action,
			Quantity: sharesPerRung,
			Price:    math.Round(price*100) / 100,
		})
	}

	return ladder
}
