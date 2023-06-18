function claimTreasure(uint256 _weekNumber, bytes calldata _signature) external noContracts nonReentrant {
    if (!(block.timestamp >= weekInfos[_weekNumber].claimStartTimeStamp && block.timestamp <= weekInfos[_weekNumber].endTimeStamp)) {
        revert InvalidClaimingPeriod();
    }
    bool isValidSigner = isSignerVerifiedFromSignature(
        _weekNumber,
        weekInfos[_weekNumber].winners[msg.sender].claimed,
        msg.sender,
        _signature
    );

    if (!isValidSigner) {
        revert InvalidSignature();
    }

    if (weekInfos[_weekNumber].winners[msg.sender].claimLimit == 0) {
        revert NotAWinner();
    }
    if (weekInfos[_weekNumber].winners[msg.sender].claimed == weekInfos[_weekNumber].winners[msg.sender].claimLimit) {
        revert AlreadyClaimed();
    }
    claimInternal(_weekNumber);
}

function claimInternal(uint256 _weekNumber) internal {
    Week storage week = weekInfos[_weekNumber];

    for (uint claim_index = weekInfos[_weekNumber].winners[msg.sender].claimed; claim_index < weekInfos[_weekNumber].winners[msg.sender].claimLimit; claim_index++) {
        uint256 remaining;
        uint256 altRemaining;
        bool claimed;

        // whatever is max for the weekly prize types
        uint[] memory claimed_types=new uint[](100);

        // skip this part if it's first cycle
        if (claim_index > 0) {
            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                //checking the treasure types that were claimed already
                for (uint claimed_type_index; claimed_type_index < claim_index; claimed_type_index++) {
                    if (treasureType==claimed_types[claimed_type_index]) {
                        claimed=true;
                    }
                }
                if (claimed) {
                    unchecked {
                        altRemaining += week.distributions[index].totalSupply;
                    }
                } else {
                    unchecked {
                        remaining += week.distributions[index].totalSupply;
                    }
                }
            }
        } else {remaining=week.remainingSupply;}

        uint256 randomNumber = getRandomNumber(claim_index);

        uint256 selectedIndex;
        uint256 sumOfTotalSupply;
        // will throw a division by zero error in case if function called when remainingSupply is 0, which should not be possible if it's not overallocated
        if (altRemaining == week.remainingSupply) {
            uint256 random = randomNumber - ((randomNumber / altRemaining) * altRemaining) + 1;
            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                // same check if the treasure types that were claimed already or not
                for (uint claimed_type_index; claimed_type_index < claim_index; claimed_type_index++) {
                    if (treasureType==claimed_types[claimed_type_index]) {
                        claimed=true;
                    }
                }
                if (week.distributions[index].totalSupply == 0 || !claimed) {
                    continue;
                }
                unchecked {
                    sumOfTotalSupply += week.distributions[index].totalSupply;
                }
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        } else {
            uint256 random = randomNumber - ((randomNumber / remaining) * remaining) + 1;

            for (uint256 index = 1; index <= week.treasureCount; index = _uncheckedInc(index)) {
                uint256 treasureType = treasures[week.distributions[index].treasureIndex].treasureType;
                // same check if the treasure types that were claimed already or not
                for (uint claimed_type_index; claimed_type_index < claim_index; claimed_type_index++) {
                    if (treasureType==claimed_types[claimed_type_index]) {
                        claimed=true;
                    }
                }
                if (week.distributions[index].totalSupply == 0 || claimed) {
                    continue;
                }
                unchecked {
                    sumOfTotalSupply += week.distributions[index].totalSupply;
                }
                if (random <= sumOfTotalSupply) {
                    selectedIndex = index;
                    break;
                }
            }
        }

        uint256 selectedTreasureIndex = week.distributions[selectedIndex].treasureIndex;
        // add claimed type to array
        claimed_types[claim_index]=treasures[selectedTreasureIndex].treasureType;

        unchecked {
            week.distributions[selectedIndex].totalSupply--;
            week.winners[msg.sender].claimed++;
            week.remainingSupply--;
            treasures[selectedTreasureIndex].claimedToken++;
        }

        transferToken(_weekNumber, treasures[selectedTreasureIndex]);
    }
}