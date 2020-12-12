export enum XDistributionEnum {
    Normal="Normal",
    Uniform = "Uniform",
    Pareto = "Pareto"
}

export enum NDistributionEnum {
    Binomial="Binomial",
    Poisson = "Poisson",
}

export enum EstimateDistributionEnum {
    Binomial="Binomial",
    Poisson = "Poisson",
    Normal = "Normal"
}

export enum VariableEnum {
    Sum = "Sum",
    Ind = "Individual"
}
export type BinomialParameters={
    n1:number
    n2:number
    m1:number
    m2:number
}
export enum EstimationMethod{

}