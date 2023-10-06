import {

  Transfer as TransferEvent,

} from "../generated/usdt/usdt"
import {

  Transfer,
  Relation,
  ContactList,

} from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts";



export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Now the regular Transfer entity logic has finished

  let tempTransactionHash = event.transaction.hash;
  let senderAddress = event.params.from;
  let receiverAddress = event.params.to;

    // Load or create the Relation from the PERSPECTIVE OF THE SENDER

    // addresses are unique and -> does not appear in addresses
    // so there are 2 unique Id for every pair of addresses that have made transactions between each other
    // 1 from the perspective of the sender
    // and 1 from the perspective of the receiver
  let senderContactId = senderAddress.toHex() + '->' + receiverAddress.toHex();
  let senderContact = Relation.load(senderContactId);
  let senderContactsList = ContactList.load(senderAddress.toHex());

  if(senderContactsList == null){ //ContactsList initialization if needed
    senderContactsList = new ContactList(senderAddress.toHex()); // key attribute
    senderContactsList.id = senderAddress.toHex();
    senderContactsList.address = senderAddress;
    senderContactsList.friends = [];
    senderContactsList.beneficiaries = [];
    senderContactsList.sponsors = [];
    senderContactsList.numberOfFriends = BigInt.fromI32(0);

  }
  
  // duplicates are possible since multiple <address1>-><someOtherAddress> transactions
  // could concat to address1's contactsList without this
  if (!senderContactsList.beneficiaries!.includes(receiverAddress)) { // we don't want duplicates after all
    senderContactsList.beneficiaries = senderContactsList.beneficiaries!.concat([receiverAddress]);
}


  if (senderContact == null) {

    

    senderContact = new Relation(senderContactId); // key attribute
    senderContact.id = senderContactId;
    senderContact.sourceAddress = senderAddress;
    senderContact.targetAddress = receiverAddress;
    senderContact.isFriend = false; 
    senderContact.isSponsor = true; // Since the sender SPONSORS the receiver
    senderContact.isBeneficiary = false;
    senderContact.valueReceived = BigInt.fromI32(0);
    senderContact.valueSent = event.params.value;
    senderContact.valueNet = BigInt.fromI32(0).minus(event.params.value);
    senderContact.firstExpenditureTimestamp = event.block.timestamp;
    senderContact.latestExpenditureTimestamp = event.block.timestamp;
    senderContact.firstIncomeTimestamp = BigInt.fromI32(-1); //-1 denotes did not occur
    senderContact.latestIncomeTimestamp = BigInt.fromI32(-1);
    
    senderContact.incomeTransactions = [];
    senderContact.expenditureTransactions = [tempTransactionHash];




  } else { // Pre-existing account
    if(!senderContact.isFriend){ // if already friends don't update relations
      senderContact.isSponsor = true; // Ensure isSponsor becomes true
    if (senderContact.isBeneficiary){ // then we are friends, and the other 2 booleans must become false
      senderContact.isFriend = true;
      senderContact.isBeneficiary = false;
      senderContact.isSponsor = false;

      if(senderContactsList && senderContactsList.sponsors && senderContactsList.beneficiaries){
      let index1 = senderContactsList.sponsors!.indexOf(receiverAddress);
      let val = senderContactsList.sponsors!.slice(index1, index1 + 1);
      senderContactsList.sponsors = senderContactsList.sponsors!.slice(0, index1).concat(senderContactsList.sponsors!.slice(index1+1));
      
      let index2 = senderContactsList.beneficiaries!.indexOf(receiverAddress);

senderContactsList.beneficiaries = senderContactsList.beneficiaries!.slice(0, index2).concat(senderContactsList.beneficiaries!.slice(index2+1));
      
      
      senderContactsList.friends = senderContactsList.friends!.concat(val);

      senderContactsList.numberOfFriends = senderContactsList.numberOfFriends.plus(BigInt.fromI32(1));


      }

      

    }

    }
    

    
    senderContact.valueSent = senderContact.valueSent.plus(event.params.value);
    senderContact.valueNet = senderContact.valueNet.minus(event.params.value);
    if(senderContact.firstExpenditureTimestamp.equals(BigInt.fromI32(-1))){
    senderContact.firstExpenditureTimestamp = event.block.timestamp;
    }
    senderContact.latestExpenditureTimestamp = event.block.timestamp;
    if(senderContact.expenditureTransactions == null){
    senderContact.expenditureTransactions = [tempTransactionHash];
    } else {
    
    senderContact.expenditureTransactions = senderContact.expenditureTransactions!.concat([tempTransactionHash]);
    
    



    }

    
  }

  // Load or create the Relation from the PERSPECTIVE OF THE RECEIVER
  let receiverContactId = receiverAddress.toHex() + '->' + senderAddress.toHex();
  let receiverContact = Relation.load(receiverContactId);
  let receiverContactsList = ContactList.load(receiverAddress.toHex());

  if (receiverContactsList == null){ //ContactsList initialization if needed
    receiverContactsList = new ContactList(receiverAddress.toHex());
    receiverContactsList.id = receiverAddress.toHex();

    receiverContactsList.address = receiverAddress;
    

    receiverContactsList.friends = [];
    receiverContactsList.beneficiaries = [];
    receiverContactsList.sponsors = [];
    receiverContactsList.numberOfFriends = BigInt.fromI32(0);

  }

  if (!receiverContactsList.sponsors!.includes(senderAddress)) { // we don't want duplicates after all
    receiverContactsList.sponsors = receiverContactsList.sponsors!.concat([senderAddress]);
}



  if (receiverContact == null) {

    


    receiverContact = new Relation(receiverContactId);
    receiverContact.id = receiverContactId;
    receiverContact.sourceAddress = receiverAddress;
    receiverContact.targetAddress = senderAddress;
    receiverContact.isFriend = false; 
    receiverContact.isSponsor = false; 
    receiverContact.isBeneficiary = true; // since the receiver has benefited from the sender
    receiverContact.valueReceived = event.params.value;
    receiverContact.valueSent = BigInt.fromI32(0);
    receiverContact.valueNet = BigInt.fromI32(0).plus(event.params.value);
    receiverContact.firstIncomeTimestamp = event.block.timestamp;
    receiverContact.latestIncomeTimestamp = event.block.timestamp;
    receiverContact.firstExpenditureTimestamp = BigInt.fromI32(-1);
    receiverContact.latestExpenditureTimestamp = BigInt.fromI32(-1);

    receiverContact.incomeTransactions = [tempTransactionHash];
    receiverContact.expenditureTransactions = [];

  } else { // Pre-existing account
    if(!receiverContact.isFriend){ // if already friends don't update relations
      receiverContact.isBeneficiary = true; // Ensure isBeneficiary becomes true
      if(receiverContact.isSponsor){ // then we are friends, and the other 2 booleans must become false
        receiverContact.isFriend = true;
        receiverContact.isBeneficiary = false;
        receiverContact.isSponsor = false;



        if(receiverContactsList && receiverContactsList.sponsors && receiverContactsList.beneficiaries){
          let index1 = receiverContactsList.sponsors!.indexOf(senderAddress);
          let val = receiverContactsList.sponsors!.slice(index1, index1 + 1);

          receiverContactsList.sponsors = receiverContactsList.sponsors!.slice(0, index1).concat(receiverContactsList.sponsors!.slice(index1+1))


          let index2 = receiverContactsList.beneficiaries!.indexOf(senderAddress);
          
          receiverContactsList.beneficiaries = receiverContactsList.beneficiaries!.slice(0, index2).concat(receiverContactsList.beneficiaries!.slice(index2+1))

          
          
          receiverContactsList.friends = receiverContactsList.friends!.concat(val);

          receiverContactsList.numberOfFriends = receiverContactsList.numberOfFriends.plus(BigInt.fromI32(1));

      }
      }
    }

    
    
    receiverContact.valueReceived = receiverContact.valueReceived.plus(event.params.value);
    receiverContact.valueNet = receiverContact.valueNet.plus(event.params.value);

    if(receiverContact.firstIncomeTimestamp.equals(BigInt.fromI32(-1))) {
        receiverContact.firstIncomeTimestamp = event.block.timestamp;
    }
    receiverContact.latestIncomeTimestamp = event.block.timestamp;



    if (receiverContact.incomeTransactions == null) {
    receiverContact.incomeTransactions = [tempTransactionHash];
    } else {
      
    receiverContact.incomeTransactions = receiverContact.incomeTransactions!.concat([tempTransactionHash]);

    }


  }
  // save Contacts so they can be loaded again if future transactions between them occur
  senderContact.save(); 
  receiverContact.save();
  if (senderContactsList) {
    senderContactsList.save();
}

if (receiverContactsList) {
    receiverContactsList.save();
}

  
  


}



