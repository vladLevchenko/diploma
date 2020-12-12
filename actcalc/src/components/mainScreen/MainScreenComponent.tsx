import { Component } from "react"
import React from "react"
import { Accordion, Button, Card, Form, FormControl, InputGroup, Navbar } from "react-bootstrap"
import './MainScreenComponent.css'
import { XDistributionEnum, EstimateDistributionEnum, NDistributionEnum, VariableEnum } from "../../models/models"
import * as XLSX from 'xlsx'
import { calc_q, estimateBinomial, estimateNormal, estimatePoisson, estimateSum, getMoments, Moments } from "../../utils/mathFormulas"

interface Props {}
interface State {
    distributionN:NDistributionEnum
    parameterAN:string
    parameterBN:string
    distributionInd:XDistributionEnum
    parameterAInd:string
    parameterBInd:string
    modelMoments: Moments|null
    modelResults:string

    alphaPercentile:number
    xResult:string

    selectionDataNormal: number[]
    estimationNormal: string

    selectionDataBinomial: number[]
    BinomialMParameter:number
    estimationBinomial:string

    selectionDataPoisson: number[]
    estimationPoisson:string
}

export class MainScreen extends Component<Props, State>{
  
  constructor(props:any){
    super(props)
    this.state = 
      {
        distributionN: NDistributionEnum.Binomial,
        parameterAN: '',
        parameterBN: '',
        distributionInd: XDistributionEnum.Normal,
        parameterAInd: '',
        parameterBInd: '',
        modelMoments:null,
        modelResults:'',

        alphaPercentile:0,
        xResult: '',

        selectionDataNormal:[],
        estimationNormal: '',

        selectionDataBinomial:[],
        estimationBinomial:'',
        BinomialMParameter:0,

        selectionDataPoisson:[],
        estimationPoisson:'',
      }
    this.onChangeDistribution = this.onChangeDistribution.bind(this);
    this.getParameterANameInd = this.getParameterANameInd.bind(this);
    this.getParameterBNameInd = this.getParameterBNameInd.bind(this);
    this.secondParameterVisible = this.secondParameterVisible.bind(this);
    this.getParameterAN = this.getParameterAN.bind(this);
    this.getParameterBN = this.getParameterBN.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.processCsv = this.processCsv.bind(this);
    this.estimateParameters = this.estimateParameters.bind(this);
    this.flushEstimations = this.flushEstimations.bind(this);
    this.estimateSumMoments = this.estimateSumMoments.bind(this);
    this.estimateX = this.estimateX.bind(this);
  }

  handleFileUpload(e:any, distribution: EstimateDistributionEnum){
    this.flushEstimations()
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = (evt) => {
      /* Parse data */
      let bstr = evt!.target!.result;
      let wb = XLSX.read(bstr, { type: 'binary' });
      /* Get first worksheet */
      let wsname = wb.SheetNames[0];
      let ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      let data = XLSX.utils.sheet_to_csv(ws);
      this.processCsv(data, distribution);
    };
    reader.readAsBinaryString(file);
  }
  flushEstimations(){
    this.setState({
      selectionDataNormal:[],
      selectionDataBinomial:[],
      selectionDataPoisson:[],
      BinomialMParameter:0,
      estimationNormal:'',
      estimationBinomial:'',
      estimationPoisson:'',
    })
  }

  processCsv(data:string , distribution: EstimateDistributionEnum){
    let selection = data.split(/\r?\n/).map(item=>parseFloat(item.replace(/,/, '.'))).filter(n=>!Number.isNaN(n));
    
    switch(distribution){
      case EstimateDistributionEnum.Normal:
        this.setState({
          selectionDataNormal:selection
        })
        break;
      case EstimateDistributionEnum.Binomial:
        this.setState({
          selectionDataBinomial:selection
        })
        break;
      case EstimateDistributionEnum.Poisson:
        this.setState({
          selectionDataPoisson:selection
        })
        break;
    }
  }

  estimateParameters(distribution:EstimateDistributionEnum){
    switch(distribution){
      case EstimateDistributionEnum.Normal:{
        let estimates = estimateNormal(this.state.selectionDataNormal)
        let resultText = `µ~${estimates.a}, σ2~${estimates.sigma2}`
        this.setState({
          estimationNormal:resultText
        })
        return
      }
      case EstimateDistributionEnum.Binomial:{
        let estimate = estimateBinomial(this.state.selectionDataBinomial, this.state.BinomialMParameter)
        let resultText = `p~${estimate}`
        this.setState({
          estimationBinomial:resultText
        })
        return
      }
      case EstimateDistributionEnum.Poisson:{
        let estimate = estimatePoisson(this.state.selectionDataPoisson)
        let resultText = `λ~${estimate}`
        this.setState({
          estimationPoisson:resultText
        })
        return
      }
    }
  }

  secondParameterVisible(){
      return this.state.distributionN!==NDistributionEnum.Poisson
  }

  onChangeDistribution(e:any, variable:VariableEnum){
    if(variable===VariableEnum.Sum)
    this.setState({
      distributionN:e.target.value
    })
    else
    this.setState({
      distributionInd:e.target.value
    })
    console.log(this.state.distributionN)

  }
  getParameterAN(){
    switch(this.state.distributionN){
      case NDistributionEnum.Binomial:
        return'k';
      case NDistributionEnum.Poisson:
        return'λ';
    }
  }

  getParameterBN(){
    switch(this.state.distributionN){
      case NDistributionEnum.Binomial:
        return'θ (0<θ<1)';
    }
  }

  getParameterANameInd(){
    switch(this.state.distributionInd){
      case XDistributionEnum.Normal:
        return 'Математичне сподівання';
      case XDistributionEnum.Pareto:
        return 'Параметр масштабу';
      case XDistributionEnum.Uniform:
        return 'a';
    }
  }

  getParameterBNameInd(){
    switch(this.state.distributionInd){
      case XDistributionEnum.Normal:
        return 'Середнє квадратичне відхилення';
      case XDistributionEnum.Pareto:
        return 'Параметр форми';
      case XDistributionEnum.Uniform:
        return 'b';
    }
  }

  estimateSumMoments(event:any){
    event.preventDefault();
    if (event.currentTarget.checkValidity() === false) {      
      event.stopPropagation();
    }
    let nMoments = getMoments(this.state.distributionN,     
        parseFloat(this.state.parameterAN),
        parseFloat(this.state.parameterBN)
      );
    let indMoments = getMoments(this.state.distributionInd,     
      parseFloat(this.state.parameterAInd),
      parseFloat(this.state.parameterBInd)
    ); 
    let estimatedSumMoments = estimateSum(nMoments,indMoments);
    this.setState({
      modelMoments:estimatedSumMoments
    })
    this.setState({
      modelResults:`Оцінка моментів суми страхових позовів: Е = ${estimatedSumMoments.E}, D = ${estimatedSumMoments.D}`
    })
  }

  
  estimateX(event:any) {
    event.preventDefault();
    if (event.currentTarget.checkValidity() === false) {      
      event.stopPropagation();
    }
    let zScore = parseFloat(calc_q(this.state.alphaPercentile))
    let xValue = zScore*Math.sqrt(this.state.modelMoments!.D)+this.state.modelMoments!.E
    this.setState({
      xResult:`X=${xValue}`
    })
  }


  render()
  {
      return(
        <div>
          <Navbar bg="light" expand="lg">
            <Navbar.Brand>Актуарний калькулятор</Navbar.Brand>
          </Navbar>   
          <Accordion defaultActiveKey="0">
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="1">
                  Оцінка параметрів розподілу за виборкою
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey="1">
                <Card.Body>
                <Form id="estimationNormal">
                  <Form.Group controlId="normalEstimation">
                    <Form.Label>Нормальний розподіл</Form.Label>
                    <Form.File id="normalSelectionFile" label="Виберіть файл з вибіркою" accept=".csv"  onChange={(e:any)=>this.handleFileUpload(e, EstimateDistributionEnum.Normal)} />
                    <br/>
                    <Button disabled={this.state.selectionDataNormal.length<1} onClick={()=>this.estimateParameters(EstimateDistributionEnum.Normal)}>Виконати оцінку</Button>
                  </Form.Group>
                  <InputGroup className="results">
                      <InputGroup.Prepend>
                        <InputGroup.Text>Результат</InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control as="textarea" value={this.state.estimationNormal} readOnly={true}></Form.Control>
                  </InputGroup>
                </Form>
                <Form id="estimationBinomial" onSubmit={(event:any)=>
                      {
                        event.preventDefault();
                        if (event.currentTarget.checkValidity() === false) {      
                          event.stopPropagation();
                        }
                        this.estimateParameters(EstimateDistributionEnum.Binomial)
                      }}>
                  <Form.Group controlId="normalEstimation">
                    <Form.Label>Біноміальний розподіл</Form.Label>
                    <Form.File id="normalSelectionFile" label="Виберіть файл з вибіркою" accept=".csv"  onChange={(e:any)=>this.handleFileUpload(e, EstimateDistributionEnum.Binomial)} />
                    <br/>
                    <Form.Label>Вкажіть значення параметра m:</Form.Label>
                    <Form.Control  type="number" pattern="[0-9]*\.?[0-9]*" inputMode="numeric"  onChange={(e:any)=>this.setState({
                      BinomialMParameter:parseInt(e.target.value)
                    })} value={this.state.BinomialMParameter}></Form.Control>
                    <br/>
                    <Button type="submit" disabled={this.state.selectionDataBinomial.length<1} >Виконати оцінку</Button>
                  </Form.Group>
                  <InputGroup className="results">
                      <InputGroup.Prepend>
                        <InputGroup.Text>Результат</InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control as="textarea" value={this.state.estimationBinomial} readOnly={true}></Form.Control>
                  </InputGroup>
                </Form>
                <Form id="estimationPoisson">
                  <Form.Group controlId="normalEstimation">
                    <Form.Label>Розподіл Пуасона</Form.Label>
                    <Form.File id="normalSelectionFile" label="Виберіть файл з вибіркою" accept=".csv"  onChange={(e:any)=>this.handleFileUpload(e, EstimateDistributionEnum.Poisson)} />
                    <br/>
                    <Button disabled={this.state.selectionDataPoisson.length<1} onClick={()=>this.estimateParameters(EstimateDistributionEnum.Poisson)}>Виконати оцінку</Button>
                  </Form.Group>
                  <InputGroup className="results">
                      <InputGroup.Prepend>
                        <InputGroup.Text>Результат</InputGroup.Text>
                      </InputGroup.Prepend>
                      <Form.Control as="textarea" value={this.state.estimationPoisson} readOnly={true}></Form.Control>
                  </InputGroup>
                </Form>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="0">
                  Модель збитків страхової компанії у випадку колективного ризику
                </Accordion.Toggle>
              </Card.Header>
            <Accordion.Collapse eventKey="0">
              <Card.Body>  
                <Form id="distributions" onSubmit={(e)=>this.estimateSumMoments(e)}>
                  <Form.Group controlId="distributionSum">
                    <Form.Label>Виберіть розподіл кількості позовів</Form.Label>  
                    <Form.Control as="select" value={this.state.distributionN} onChange={(e:any)=>this.onChangeDistribution(e, VariableEnum.Sum)}>
                      <option value={NDistributionEnum.Binomial}>Біноміальний</option>
                      <option value={NDistributionEnum.Poisson}>Пуасон</option>
                    </Form.Control>
                  </Form.Group>
                  <Form.Group className="parameters" controlId="sumParameters">
                    <Form.Label>Вкажіть параметри розподілу</Form.Label> 
                    <br/> 
                    <Form.Label>{this.getParameterAN()}</Form.Label>
                    <Form.Control type="number" pattern="[0-9]*\.?[0-9]*" inputMode="numeric" value={this.state.parameterAN} onChange={(e:any)=>{
                      this.setState({
                        parameterAN: e.target.value
                      })
                    }}/>
                    {this.secondParameterVisible() && (
                      <div>
                         <Form.Label>{this.getParameterBN()}</Form.Label>
                         <Form.Control type="text" pattern={this.state.distributionN===NDistributionEnum.Binomial?"0\.[0-9]*":"[0-9]*\.?[0-9]*"} inputMode="numeric" value={this.state.parameterBN} onChange={(e:any)=>{
                          this.setState({
                            parameterBN: e.target.value
                          })
                        }} />
                      </div>
                    )}
                   
                  </Form.Group>        
                  <Form.Group controlId="distributionInd">
                    <Form.Label>Виберіть розподіл величини індивідуального позову</Form.Label>  
                    <Form.Control as="select" value={this.state.distributionInd} onChange={(e:any)=>this.onChangeDistribution(e, VariableEnum.Ind)}>
                      <option value={XDistributionEnum.Normal}>Нормальний</option>
                      <option value={XDistributionEnum.Pareto}>Парето</option>
                      <option value={XDistributionEnum.Uniform}>Рівномірний</option>
                    </Form.Control>
                  </Form.Group>
                  <Form.Group className="parameters" controlId="indParameters">
                    <Form.Label>Вкажіть параметри розподілу</Form.Label> 
                    <br/> 
                    <Form.Label>{this.getParameterANameInd()}</Form.Label>
                    <Form.Control type="number" pattern="[0-9]*\.?[0-9]*" inputMode="numeric" value={this.state.parameterAInd} onChange={(e:any)=>{
                      this.setState({
                        parameterAInd: e.target.value
                      })
                    }}/>
                    <Form.Label>{this.getParameterBNameInd()}</Form.Label>
                    <Form.Control type="number" pattern="[0-9]*\.?[0-9]*" inputMode="numeric" value={this.state.parameterBInd} onChange={(e:any)=>{
                      this.setState({
                        parameterBInd: e.target.value
                      })
                    }}/>
                  </Form.Group>
                  <Button type="submit">Виконати розрахунки</Button>
                  <br/>                  
                </Form>
                <InputGroup className="results">
                  <InputGroup.Prepend>
                    <InputGroup.Text>Результат</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl as="textarea" aria-label="results" value={this.state.modelResults} readOnly={true}/>
                </InputGroup>
                {this.state.modelResults.length>0 && <div><Form onSubmit={(event:any)=>this.estimateX(event)}>
                  <Form.Group controlId="findXbyProb">
                    <Form.Label>Знаходження оптимального значення Х для P(S&lt;x)=α </Form.Label> 
                    <br/>
                     <Form.Label>Введіть значення вірогідності α (0&lt;α&lt;1)</Form.Label>
                     <Form.Control type="text" pattern="0\.[0-9]*" inputMode="numeric" value={this.state.alphaPercentile} onChange={(e:any)=>{
                      this.setState({
                        alphaPercentile: e.target.value
                      })
                    }}/>
                    
                  </Form.Group>
                  <Button type="submit">Виконати розрахунки</Button>
                 
                </Form>
                 <InputGroup className="xResults">
                 <InputGroup.Prepend>
                   <InputGroup.Text>Результат</InputGroup.Text>
                 </InputGroup.Prepend>
                 <FormControl as="textarea" aria-label="results" value={this.state.xResult} readOnly={true}/>
               </InputGroup></div>}
              </Card.Body>
            </Accordion.Collapse>
            </Card>
          </Accordion>
        </div>
      )
  }
}
