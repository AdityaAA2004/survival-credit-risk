package com.survivalrisk.controller;

import com.survivalrisk.dto.BorrowerInput;
import com.survivalrisk.dto.PredictionResponse;
import com.survivalrisk.service.ArtifactLoader;
import com.survivalrisk.service.CoxPhService;
import com.survivalrisk.service.DeepSurvService;
import com.survivalrisk.service.DiscreteHazardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.StructuredTaskScope;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/api")
public class PredictionController {

    @Autowired private ArtifactLoader artifacts;
    @Autowired private CoxPhService coxPhService;
    @Autowired private DiscreteHazardService discreteHazardService;
    @Autowired private DeepSurvService deepSurvService;

    private static final int MAX_T = 60;

    @GetMapping("/features")
    public List<String> features() {
        return artifacts.featureCols;
    }

    @PostMapping("/predict")
    public PredictionResponse predict(@RequestBody BorrowerInput input) throws Exception {
        double[] features = artifacts.featureCols.stream()
                .mapToDouble(input::get)
                .toArray();

        int[] timePoints = IntStream.rangeClosed(1, MAX_T).toArray();

        try (var scope = StructuredTaskScope.open(
                StructuredTaskScope.Joiner.<double[]>awaitAllSuccessfulOrThrow())) {
            var cox      = scope.fork(() -> coxPhService.predict(features));
            var discrete = scope.fork(() -> discreteHazardService.predict(features));
            var deep     = scope.fork(() -> deepSurvService.predict(features));
            scope.join();
            return new PredictionResponse(cox.get(), discrete.get(), deep.get(), timePoints);
        }
    }
}
