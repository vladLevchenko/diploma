import { NDistributionEnum, XDistributionEnum } from "../models/models";

export function getMean(arr:number[]){
    return (arr.reduce((a,b)=>a+b,0))/arr.length;

}

export enum MethodEnum{
    MLE="MLE",
    Moments="Moments"
}
export type Moments = {
    E:number,
    D:number
}

export function estimatePoisson(X:number[]){
    return getMean(X)
}

export function estimateNormal(X:number[]){
    let mean = getMean(X)
    let sumSquareN = 0
    for(let i=0;i<X.length;i++){
        sumSquareN+=Math.pow(X[i]-mean,2)
    }
    return {
        a:mean,
        sigma2:sumSquareN/X.length
    }
}
export function getMoments(distribution:XDistributionEnum|NDistributionEnum, ...params:number[]):Moments{
    switch (distribution){
        case NDistributionEnum.Poisson:{
            return {
                E:params[0],
                D:params[0]
            }
        }
        case NDistributionEnum.Binomial:{
            return{
                E:params[0]*params[1],
                D:params[0]*params[1]*(1-params[1])
            }
        }
        case XDistributionEnum.Uniform:{
            return {
                E:(params[0]+params[1])/2,
                D:Math.pow(params[1]-params[0],2)/12
            }
        }
        case XDistributionEnum.Normal:{
            return {
                E:params[0],
                D:Math.pow(params[1],2)
            }
        }
        case XDistributionEnum.Pareto:{
            return{
                E:params[1]/(params[0]-1),
                D:params[0]*params[1]*params[1]/((params[0]-1)*(params[0]-1)*(params[0]-2))
            }
        }
    }
}

export function estimateSum(nMoments:Moments,xMoments:Moments): Moments{
    return{
        E:nMoments.E*xMoments.E,
        D:xMoments.D*nMoments.E+xMoments.E*xMoments.E*nMoments.D
    }
}

export function estimateBinomial(X:number[], m:number){
    return getMean(X)/m
}


const Z_MAX = 6

export function calc_q(q:number) {
    if (q < 0 ||
        q > 1) {
        alert("Probability (Q) must be between 0 and 1.");
        return ''
    } else {
        return Math.abs(critz(q)).toFixed(3)
    }
}

function critz(p:number) {
    var Z_EPSILON = 0.000001;     /* Accuracy of z approximation */
    var minz = -Z_MAX;
    var maxz = Z_MAX;
    var zval = 0.0;
    var pval;
    
    if (p < 0.0 || p > 1.0) {
        return -1;
    }
    
    while ((maxz - minz) > Z_EPSILON) {
        pval = poz(zval);
        if (pval > p) {
            maxz = zval;
        } else {
            minz = zval;
        }
        zval = (maxz + minz) * 0.5;
    }
    return(zval);
}

function poz(z:number) {
    var y, x, w;
    
    if (z === 0.0) {
        x = 0.0;
    } else {
        y = 0.5 * Math.abs(z);
        if (y > (Z_MAX * 0.5)) {
            x = 1.0;
        } else if (y < 1.0) {
            w = y * y;
            x = ((((((((0.000124818987 * w
                     - 0.001075204047) * w + 0.005198775019) * w
                     - 0.019198292004) * w + 0.059054035642) * w
                     - 0.151968751364) * w + 0.319152932694) * w
                     - 0.531923007300) * w + 0.797884560593) * y * 2.0;
        } else {
            y -= 2.0;
            x = (((((((((((((-0.000045255659 * y
                           + 0.000152529290) * y - 0.000019538132) * y
                           - 0.000676904986) * y + 0.001390604284) * y
                           - 0.000794620820) * y - 0.002034254874) * y
                           + 0.006549791214) * y - 0.010557625006) * y
                           + 0.011630447319) * y - 0.009279453341) * y
                           + 0.005353579108) * y - 0.002141268741) * y
                           + 0.000535310849) * y + 0.999936657524;
        }
    }
    return z > 0.0 ? ((x + 1.0) * 0.5) : ((1.0 - x) * 0.5);
}

