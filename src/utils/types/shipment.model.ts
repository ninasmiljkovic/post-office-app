export enum ShipmentTypes {
  letter =  'LETTER',
  package = 'PACKAGE',
}

export enum ShipmentStatuses {
  originProcessed =  'ORIGIN_PROCESSED',
  destinationProcessed = 'DESTINATION_PROCESSED',
  delivered = 'DELIVERED',
}

export enum ShipmentWeights {
  lessThan1 =  'LESS_THAN_1KG',
  between1And5 = 'BETWEEN_1KG_5KG',
  moreThan5 = 'MORE_THAN_5KG',
}
