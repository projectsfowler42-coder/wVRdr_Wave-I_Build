package execution

import "errors"

type ExecutionConfig struct {
	Mode             string
	AllowLiveOrders  bool
	AccountWhitelist []string
	MaxOrderNotional float64
}

// HARD-LOCKED: No live transmission permitted in Phase A.
var CurrentConfig = ExecutionConfig{
	Mode:             "SHADOW",
	AllowLiveOrders:  false,
	AccountWhitelist: []string{"PAPER_ONLY"},
	MaxOrderNotional: 5000.0,
}

func VerifyLiveSafety() error {
	if CurrentConfig.AllowLiveOrders || CurrentConfig.Mode != "SHADOW" {
		return errors.New("[CRITICAL] ILLEGAL_MODE: Live transmission blocked in Phase A")
	}
	return nil
}
