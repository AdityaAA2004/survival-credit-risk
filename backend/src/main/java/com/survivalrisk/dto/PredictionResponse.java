package com.survivalrisk.dto;

public record PredictionResponse(
        double[] cox_ph,
        double[] discrete_hazard,
        double[] deepsurv,
        int[] time_points
) {}
