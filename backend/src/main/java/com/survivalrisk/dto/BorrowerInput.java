package com.survivalrisk.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import java.util.HashMap;
import java.util.Map;

public class BorrowerInput {
    private final Map<String, Double> features = new HashMap<>();

    @JsonAnySetter
    public void set(String key, double value) {
        features.put(key, value);
    }

    public double get(String col) {
        Double val = features.get(col);
        if (val == null) throw new IllegalArgumentException("Missing feature: " + col);
        return val;
    }
}
